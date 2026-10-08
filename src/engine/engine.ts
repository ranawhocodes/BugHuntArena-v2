import {
  BASE_XP,
  MIN_XP,
  MAX_STREAK_BONUS_PERCENT,
  STREAK_BONUS_PER_DAY,
  HINT_COSTS,
  BITS_PER_XP_RATIO,
  CLEAN_CATCH_BONUS_BITS,
  LEVEL_DIVISOR,
  LEVEL_TITLES,
} from './constants';
import type { Difficulty, BugPuzzle } from '../content/types';
import type { ExperienceLevel } from '../storage/schema';

export interface XpResult {
  baseXp: number;
  streakBonus: number;
  hintPenalty: number;
  totalXp: number;
  cleanCatch: boolean;
}

/**
 * Calculates XP earned for solving a puzzle.
 * - Base XP from difficulty (20, 35, 50)
 * - Streak bonus: +5% per day up to 25%
 * - Hint penalty: cumulative cost of hints used (0%, 15%, 30%, 45%)
 * - Enforces MIN_XP (5)
 */
export function calculateXP(
  difficulty: Difficulty,
  streakDays: number,
  hintsUsed: number,
  cleanCatch: boolean,
): XpResult {
  const baseXp = BASE_XP[difficulty] ?? 20;

  // Streak bonus
  const streakPct = Math.min(streakDays * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS_PERCENT);
  const streakBonus = Math.round((baseXp * streakPct) / 100);

  // Hint penalty
  let hintPct = 0;
  if (!cleanCatch && hintsUsed > 0) {
    const hintIdx = Math.min(hintsUsed - 1, HINT_COSTS.length - 1);
    hintPct = HINT_COSTS[hintIdx];
  }
  const hintPenalty = Math.round(baseXp * hintPct);

  const rawTotal = baseXp + streakBonus - hintPenalty;
  const totalXp = Math.max(MIN_XP, rawTotal);

  return {
    baseXp,
    streakBonus,
    hintPenalty,
    totalXp,
    cleanCatch,
  };
}

/**
 * Calculates Bug Bits earned from XP.
 * 1 Bit per 5 XP, plus +3 Bits for a clean catch.
 */
export function calculateBugBits(xpEarned: number, cleanCatch: boolean): number {
  const baseBits = Math.floor(xpEarned / BITS_PER_XP_RATIO);
  const bonus = cleanCatch ? CLEAN_CATCH_BONUS_BITS : 0;
  return baseBits + bonus;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentLevelXp: number; // XP threshold for start of current level
  nextLevelXp: number; // XP threshold for next level
  progressPercent: number; // 0..100 within current level
}

/**
 * Level formula: level = floor(sqrt(totalXp / 40)) + 1
 * Threshold for Level L: XP = (L - 1)^2 * 40
 */
export function calculateLevel(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, totalXp);
  const level = Math.floor(Math.sqrt(safeXp / LEVEL_DIVISOR)) + 1;

  const currentLevelXp = Math.pow(level - 1, 2) * LEVEL_DIVISOR;
  const nextLevelXp = Math.pow(level, 2) * LEVEL_DIVISOR;

  const xpInLevel = safeXp - currentLevelXp;
  const levelSpan = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInLevel / levelSpan) * 100)),
  );

  let title = LEVEL_TITLES[0][1];
  for (const [lvl, lvlTitle] of LEVEL_TITLES) {
    if (level >= lvl) {
      title = lvlTitle;
    }
  }

  return {
    level,
    title,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
  };
}

export interface StreakUpdateResult {
  newStreak: number;
  freezesLeft: number;
  streakSaved: boolean;
}

/**
 * Updates streak based on last active date string ('YYYY-MM-DD').
 * Preserves streak using a freeze if 1 day was missed.
 */
export function updateStreak(
  lastActiveDate: string | null,
  currentStreak: number,
  freezesAvailable: number,
  todayStr: string,
): StreakUpdateResult {
  if (!lastActiveDate) {
    return {
      newStreak: 1,
      freezesLeft: freezesAvailable,
      streakSaved: false,
    };
  }

  if (lastActiveDate === todayStr) {
    return {
      newStreak: currentStreak,
      freezesLeft: freezesAvailable,
      streakSaved: false,
    };
  }

  const lastTime = new Date(`${lastActiveDate}T00:00:00Z`).getTime();
  const todayTime = new Date(`${todayStr}T00:00:00Z`).getTime();
  const dayDiff = Math.round((todayTime - lastTime) / (24 * 60 * 60 * 1000));

  if (dayDiff === 1) {
    // Consecutive day
    return {
      newStreak: currentStreak + 1,
      freezesLeft: freezesAvailable,
      streakSaved: false,
    };
  }

  if (dayDiff === 2 && freezesAvailable > 0) {
    // Missed exactly 1 day and has freeze available
    return {
      newStreak: currentStreak + 1,
      freezesLeft: freezesAvailable - 1,
      streakSaved: true,
    };
  }

  // Streak broken
  return {
    newStreak: 1,
    freezesLeft: freezesAvailable,
    streakSaved: false,
  };
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 * for daily puzzle selection by date string seed.
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministically picks 3 distinct daily puzzles for a given 'YYYY-MM-DD' date string.
 */
export function getDailyPuzzles(
  dateStr: string,
  puzzles: BugPuzzle[],
): [BugPuzzle, BugPuzzle, BugPuzzle] {
  if (puzzles.length < 3) {
    throw new Error('At least 3 puzzles required for daily selection');
  }

  const rng = mulberry32(stringToSeed(dateStr));
  const pool = [...puzzles];

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return [pool[0], pool[1], pool[2]];
}

/**
 * Difficulty order for a learner's self-reported experience.
 * New debuggers start on Easy and graduate to Medium; experienced debuggers start on
 * Medium (and Hard, when available) and keep Easy for warm-ups at the end.
 */
export function trackDifficulties(experience: ExperienceLevel | undefined): Difficulty[] {
  return experience === 'experienced' ? [2, 3, 1] : [1, 2, 3];
}

/** Puzzles ordered for a track: preferred difficulty first, original order kept within a tier. */
export function orderPuzzlesForTrack(
  puzzles: BugPuzzle[],
  experience: ExperienceLevel | undefined,
): BugPuzzle[] {
  const order = trackDifficulties(experience);
  return [...puzzles].sort((a, b) => order.indexOf(a.difficulty) - order.indexOf(b.difficulty));
}

/**
 * Pool for the Daily Hunt: the track's core difficulty when there are enough puzzles,
 * otherwise the full bank so the daily always has three distinct picks.
 */
export function dailyPoolForTrack(
  puzzles: BugPuzzle[],
  experience: ExperienceLevel | undefined,
): BugPuzzle[] {
  const core = trackDifficulties(experience)[0];
  const pool = puzzles.filter((p) => p.difficulty === core);
  return pool.length >= 3 ? pool : puzzles;
}

/** Difficulty to request from the AI generator for a track. */
export function aiDifficultyFor(experience: ExperienceLevel | undefined): Difficulty {
  return experience === 'experienced' ? 3 : 1;
}

/** Index of the first unsolved puzzle in a list, or 0 when everything is solved. */
export function firstUnsolvedIndex(puzzles: BugPuzzle[], completedIds: string[]): number {
  const idx = puzzles.findIndex((p) => !completedIds.includes(p.id));
  return idx === -1 ? 0 : idx;
}
