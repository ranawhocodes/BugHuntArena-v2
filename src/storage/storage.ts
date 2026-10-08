import { STORAGE_KEY_PREFIX, LEGACY_STORAGE_KEY, MAX_STORAGE_BYTES } from '../engine/constants';
import { createInitialPlayerState } from './schema';
import type { PlayerSaveData, PetState, ExperienceLevel, DailyProgress } from './schema';

const MAX_LIST_ITEMS = 500;
const MAX_ID_LENGTH = 120;
const MAX_NAME_LENGTH = 40;
const PET_SPECIES: PetState['species'][] = ['fire_beetle', 'byte_moth', 'glitch_hound'];
const PET_COSMETICS: NonNullable<PetState['cosmetic']>[] = ['hat', 'glasses', 'crown'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['new', 'experienced'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCount(value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(0, Math.floor(value)))
    : fallback;
}

function toIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter(
    (v): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH,
  );
  return [...new Set(ids)].slice(0, MAX_LIST_ITEMS);
}

function toDate(value: unknown): string | null {
  return typeof value === 'string' && DATE_RE.test(value) ? value : null;
}

/**
 * Validates and normalises save data from any untrusted source (localStorage or the
 * cloud). Unknown fields are dropped, numbers are clamped, lists are de-duplicated.
 * Returns null when the payload is not a recognisable save at all.
 */
export function sanitizeSaveData(input: unknown): PlayerSaveData | null {
  if (!isRecord(input) || input.version !== 1) return null;
  if (typeof input.xp !== 'number' || !isRecord(input.pet)) return null;

  const base = createInitialPlayerState();
  const pet = input.pet;

  const categoryStats: PlayerSaveData['categoryStats'] = {};
  if (isRecord(input.categoryStats)) {
    for (const [key, raw] of Object.entries(input.categoryStats)) {
      if (!isRecord(raw) || key.length > 40) continue;
      categoryStats[key as keyof PlayerSaveData['categoryStats']] = {
        attempts: toCount(raw.attempts, 0),
        mistakes: toCount(raw.mistakes, 0),
        cleanCatches: toCount(raw.cleanCatches, 0),
      };
    }
  }

  let dailyProgress: DailyProgress | undefined;
  if (isRecord(input.dailyProgress)) {
    const date = toDate(input.dailyProgress.date);
    if (date) dailyProgress = { date, clearedPuzzleIds: toIdList(input.dailyProgress.clearedPuzzleIds) };
  }

  const name = typeof input.playerName === 'string' ? input.playerName.trim().slice(0, MAX_NAME_LENGTH) : '';
  const stage = toCount(pet.stage, 1, 4);

  return {
    version: 1,
    ...(name ? { playerName: name } : {}),
    ...(EXPERIENCE_LEVELS.includes(input.experience as ExperienceLevel)
      ? { experience: input.experience as ExperienceLevel }
      : {}),
    ...(dailyProgress ? { dailyProgress } : {}),
    xp: toCount(input.xp, 0),
    bugBits: toCount(input.bugBits, base.bugBits),
    streakDays: toCount(input.streakDays, 0),
    streakFreezes: toCount(input.streakFreezes, base.streakFreezes, 2),
    lastActiveDate: toDate(input.lastActiveDate),
    completedPuzzleIds: toIdList(input.completedPuzzleIds),
    capturedCreatureIds: toIdList(input.capturedCreatureIds),
    unlockedBadgeIds: toIdList(input.unlockedBadgeIds),
    categoryStats,
    pet: {
      species: PET_SPECIES.includes(pet.species as PetState['species'])
        ? (pet.species as PetState['species'])
        : base.pet.species,
      name: typeof pet.name === 'string' && pet.name.trim() ? pet.name.trim().slice(0, MAX_NAME_LENGTH) : base.pet.name,
      stage: (stage >= 1 ? stage : 1) as PetState['stage'],
      happiness: toCount(pet.happiness, base.pet.happiness, 100),
      lastFedTimestamp: toCount(pet.lastFedTimestamp, base.pet.lastFedTimestamp),
      strokesToday: toCount(pet.strokesToday, 0),
      lastStrokeDate: toDate(pet.lastStrokeDate) ?? base.pet.lastStrokeDate,
      cosmetic: PET_COSMETICS.includes(pet.cosmetic as NonNullable<PetState['cosmetic']>)
        ? (pet.cosmetic as PetState['cosmetic'])
        : null,
    },
    dailyCompletedDates: Array.isArray(input.dailyCompletedDates)
      ? input.dailyCompletedDates.map(toDate).filter((d): d is string => d !== null).slice(-MAX_LIST_ITEMS)
      : [],
  };
}

/** Storage key for one account. Every user gets an isolated local cache. */
export function storageKeyFor(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Removes the pre-accounts global save key. It was shared by everyone who used the
 * same browser, so it must never be read into a signed-in account.
 */
export function purgeLegacySave(): void {
  try {
    window.localStorage?.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Safely loads a user's cached save data from localStorage.
 * Guaranteed to never throw — returns initial state on any error.
 */
export function loadSaveData(userId: string): PlayerSaveData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialPlayerState();
  }

  try {
    const raw = window.localStorage.getItem(storageKeyFor(userId));
    if (!raw) return createInitialPlayerState();

    const parsed = sanitizeSaveData(JSON.parse(raw));
    if (parsed) return parsed;

    console.warn('Storage data corrupted or incompatible version, resetting.');
    return createInitialPlayerState();
  } catch {
    return createInitialPlayerState();
  }
}

/**
 * Safely saves a user's state to localStorage.
 * Checks byte budget and catches QuotaExceeded errors.
 */
export function saveData(userId: string, data: PlayerSaveData): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const json = JSON.stringify(data);
    if (json.length > MAX_STORAGE_BYTES) {
      console.error(`Save state exceeds max storage limit (${json.length} bytes).`);
      return false;
    }

    window.localStorage.setItem(storageKeyFor(userId), json);
    return true;
  } catch (err) {
    console.error('Failed to write to localStorage:', err);
    return false;
  }
}

/**
 * Clears a user's cached save data from localStorage.
 */
export function clearSaveData(userId: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(storageKeyFor(userId));
    } catch {
      // Ignore
    }
  }
}
