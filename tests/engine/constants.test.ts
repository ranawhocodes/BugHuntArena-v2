import { describe, it, expect } from 'vitest';
import {
  BASE_XP,
  MIN_XP,
  MAX_STREAK_BONUS_PERCENT,
  LEVEL_DIVISOR,
  STORAGE_KEY_PREFIX,
  LEGACY_STORAGE_KEY,
  MAX_CODE_LINE_LENGTH,
  LEVEL_TITLES,
} from '../../src/engine/constants';

describe('engine/constants', () => {
  it('defines base XP for all three difficulties', () => {
    expect(BASE_XP[1]).toBe(20);
    expect(BASE_XP[2]).toBe(35);
    expect(BASE_XP[3]).toBe(50);
  });

  it('minimum XP is 5', () => {
    expect(MIN_XP).toBe(5);
  });

  it('max streak bonus is 25%', () => {
    expect(MAX_STREAK_BONUS_PERCENT).toBe(25);
  });

  it('level divisor is 40', () => {
    expect(LEVEL_DIVISOR).toBe(40);
  });

  it('storage keys are namespaced per account', () => {
    expect(STORAGE_KEY_PREFIX).toBe('bugwug:v1:');
    expect(LEGACY_STORAGE_KEY).toBe('bha:v1');
  });

  it('max code line length is 60 characters', () => {
    expect(MAX_CODE_LINE_LENGTH).toBe(60);
  });

  it('level titles are ordered and non-empty', () => {
    expect(LEVEL_TITLES.length).toBeGreaterThan(0);
    for (const [level, title] of LEVEL_TITLES) {
      expect(level).toBeGreaterThan(0);
      expect(title.length).toBeGreaterThan(0);
    }
  });
});
