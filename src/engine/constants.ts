/** Placeholder constants — per spec Section 4.4 engine/constants.ts */

/** Base XP by difficulty: Easy=20, Medium=35, Hard=50 */
export const BASE_XP: Record<number, number> = {
  1: 20,
  2: 35,
  3: 50,
};

/** Minimum XP awarded for completing any puzzle */
export const MIN_XP = 5;

/** Maximum streak bonus percentage */
export const MAX_STREAK_BONUS_PERCENT = 25;

/** Streak bonus per day (percent) */
export const STREAK_BONUS_PER_DAY = 5;

/** Hint cost percentages of base XP (cumulative) */
export const HINT_COSTS = [0.15, 0.30, 0.45] as const;

/** Max streak freezes a player can hold */
export const MAX_STREAK_FREEZES = 2;

/** Streak milestone interval for earning a freeze */
export const STREAK_FREEZE_MILESTONE = 7;

/** Bug Bits per XP ratio */
export const BITS_PER_XP_RATIO = 5;

/** Clean Catch bonus Bug Bits */
export const CLEAN_CATCH_BONUS_BITS = 3;

/** Level formula constant: level = floor(sqrt(xp / LEVEL_DIVISOR)) + 1 */
export const LEVEL_DIVISOR = 40;

/** Pet feed cost in Bug Bits */
export const PET_FEED_COST = 5;

/** Pet feed cooldown in milliseconds (2 hours) */
export const PET_FEED_COOLDOWN_MS = 2 * 60 * 60 * 1000;

/** Max pet strokes per day */
export const PET_MAX_STROKES_PER_DAY = 3;

/** Pet sleepy threshold in milliseconds (24 hours) */
export const PET_SLEEPY_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/** Per-account storage key prefix; the user id is appended */
export const STORAGE_KEY_PREFIX = 'bugwug:v1:';

/** Pre-accounts global key, shared across users of one browser — purged on login */
export const LEGACY_STORAGE_KEY = 'bha:v1';

/** Max storage blob size in bytes */
export const MAX_STORAGE_BYTES = 200 * 1024;

/** Storage write debounce in milliseconds */
export const STORAGE_DEBOUNCE_MS = 300;

/** Puzzles in one Daily Hunt */
export const DAILY_PUZZLE_COUNT = 3;

/** Daily history prune limit (days) */
export const DAILY_HISTORY_LIMIT = 60;

/** AI request rate limit per IP per minute */
export const AI_RATE_LIMIT_PER_MIN = 8;

/** AI request timeout in milliseconds */
export const AI_TIMEOUT_MS = 12_000;

/** AI client cooldown in milliseconds */
export const AI_CLIENT_COOLDOWN_MS = 3_000;

/** Max cached AI puzzles */
export const AI_CACHE_SIZE = 20;

/** Max line length for puzzle code */
export const MAX_CODE_LINE_LENGTH = 60;

/** Level title bands per spec Section 4.5 */
export const LEVEL_TITLES: [number, string][] = [
  [1, 'Rookie Debugger'],
  [2, 'Bug Spotter'],
  [3, 'Line Hunter'],
  [4, 'Code Detective'],
  [6, 'Arena Veteran'],
  [8, 'Bug Slayer'],
  [10, 'Legend'],
];
