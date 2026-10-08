import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSaveData,
  saveData,
  clearSaveData,
  purgeLegacySave,
  sanitizeSaveData,
  storageKeyFor,
} from '../../src/storage/storage';
import { createInitialPlayerState } from '../../src/storage/schema';
import { LEGACY_STORAGE_KEY } from '../../src/engine/constants';

const USER_A = 'user-a';
const USER_B = 'user-b';

describe('Storage Layer Resilience', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default initial player state when storage is empty', () => {
    const data = loadSaveData(USER_A);
    expect(data.version).toBe(1);
    expect(data.xp).toBe(0);
    expect(data.bugBits).toBe(50);
    expect(data.streakDays).toBe(0);
    expect(data.pet.name).toBe('Sparky');
  });

  it('saves and reloads state accurately', () => {
    const state = createInitialPlayerState();
    state.xp = 120;
    state.bugBits = 85;
    state.streakDays = 4;
    state.experience = 'experienced';
    state.completedPuzzleIds = ['py-01-off-by-one'];

    expect(saveData(USER_A, state)).toBe(true);

    const reloaded = loadSaveData(USER_A);
    expect(reloaded.xp).toBe(120);
    expect(reloaded.bugBits).toBe(85);
    expect(reloaded.streakDays).toBe(4);
    expect(reloaded.experience).toBe('experienced');
    expect(reloaded.completedPuzzleIds).toContain('py-01-off-by-one');
  });

  it('gracefully recovers to initial state when storage is corrupted with invalid JSON', () => {
    localStorage.setItem(storageKeyFor(USER_A), '{invalid-malformed-json:::');
    const data = loadSaveData(USER_A);
    expect(data.version).toBe(1);
    expect(data.xp).toBe(0);
  });

  it('gracefully recovers when storage has incompatible version or missing required fields', () => {
    localStorage.setItem(storageKeyFor(USER_A), JSON.stringify({ version: 99, unknownField: true }));
    const data = loadSaveData(USER_A);
    expect(data.version).toBe(1);
    expect(data.xp).toBe(0);
  });
});

describe('Per-account isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('never shows one account the progress of another account on the same browser', () => {
    const progressA = { ...createInitialPlayerState(), xp: 999, playerName: 'Alice' };
    saveData(USER_A, progressA);

    const seenByB = loadSaveData(USER_B);
    expect(seenByB.xp).toBe(0);
    expect(seenByB.playerName).toBeUndefined();
    expect(loadSaveData(USER_A).xp).toBe(999);
  });

  it('clearing one account leaves other accounts untouched', () => {
    saveData(USER_A, { ...createInitialPlayerState(), xp: 10 });
    saveData(USER_B, { ...createInitialPlayerState(), xp: 20 });
    clearSaveData(USER_A);
    expect(loadSaveData(USER_A).xp).toBe(0);
    expect(loadSaveData(USER_B).xp).toBe(20);
  });

  it('purges the old shared, pre-accounts save key', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(createInitialPlayerState()));
    purgeLegacySave();
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });
});

describe('sanitizeSaveData (untrusted local/cloud data)', () => {
  it('rejects payloads that are not saves', () => {
    expect(sanitizeSaveData(null)).toBeNull();
    expect(sanitizeSaveData('hello')).toBeNull();
    expect(sanitizeSaveData({ version: 2, xp: 1, pet: {} })).toBeNull();
    expect(sanitizeSaveData({ version: 1, xp: 'lots', pet: {} })).toBeNull();
  });

  it('clamps numbers, drops unknown fields and bad enum values', () => {
    const result = sanitizeSaveData({
      version: 1,
      xp: -50,
      bugBits: 12.7,
      streakDays: 3,
      streakFreezes: 99,
      experience: 'wizard',
      isAdmin: true,
      completedPuzzleIds: ['py-01', 'py-01', 42, ''],
      pet: { species: 'dragon', stage: 9, happiness: 500, cosmetic: 'cape' },
    });

    expect(result).not.toBeNull();
    expect(result!.xp).toBe(0);
    expect(result!.bugBits).toBe(12);
    expect(result!.streakFreezes).toBe(2);
    expect(result!.experience).toBeUndefined();
    expect(result).not.toHaveProperty('isAdmin');
    expect(result!.completedPuzzleIds).toEqual(['py-01']);
    expect(result!.pet.species).toBe('fire_beetle');
    expect(result!.pet.stage).toBe(4);
    expect(result!.pet.happiness).toBe(100);
    expect(result!.pet.cosmetic).toBeNull();
  });

  it('keeps valid daily progress and drops malformed dates', () => {
    const good = sanitizeSaveData({
      ...createInitialPlayerState(),
      dailyProgress: { date: '2026-10-08', clearedPuzzleIds: ['js-01'] },
    });
    expect(good!.dailyProgress).toEqual({ date: '2026-10-08', clearedPuzzleIds: ['js-01'] });

    const bad = sanitizeSaveData({
      ...createInitialPlayerState(),
      dailyProgress: { date: 'yesterday', clearedPuzzleIds: [] },
    });
    expect(bad!.dailyProgress).toBeUndefined();
  });
});
