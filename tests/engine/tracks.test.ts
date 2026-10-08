import { describe, it, expect } from 'vitest';
import {
  trackDifficulties,
  orderPuzzlesForTrack,
  dailyPoolForTrack,
  aiDifficultyFor,
  firstUnsolvedIndex,
  getDailyPuzzles,
} from '../../src/engine/engine';
import { ALL_PUZZLES, getPuzzlesByLanguage } from '../../src/content/puzzles';

describe('Experience tracks', () => {
  it('new debuggers start on Easy; experienced start on Medium', () => {
    expect(trackDifficulties('new')[0]).toBe(1);
    expect(trackDifficulties(undefined)[0]).toBe(1);
    expect(trackDifficulties('experienced')[0]).toBe(2);
  });

  it('orders the bank so the track difficulty comes first', () => {
    const python = getPuzzlesByLanguage('python');
    const forNew = orderPuzzlesForTrack(python, 'new');
    const forExperienced = orderPuzzlesForTrack(python, 'experienced');

    expect(forNew).toHaveLength(python.length);
    expect(forNew[0].difficulty).toBe(1);
    expect(forExperienced[0].difficulty).toBe(2);
    // Every Easy puzzle precedes every Medium one for beginners
    const lastEasy = forNew.map((p) => p.difficulty).lastIndexOf(1);
    const firstMedium = forNew.findIndex((p) => p.difficulty === 2);
    expect(lastEasy).toBeLessThan(firstMedium);
  });

  it('does not mutate the source puzzle list', () => {
    const python = getPuzzlesByLanguage('python');
    const before = python.map((p) => p.id);
    orderPuzzlesForTrack(python, 'experienced');
    expect(python.map((p) => p.id)).toEqual(before);
  });

  it('builds a daily pool of the track difficulty with three distinct picks', () => {
    for (const track of ['new', 'experienced'] as const) {
      const pool = dailyPoolForTrack(ALL_PUZZLES, track);
      const expected = trackDifficulties(track)[0];
      expect(pool.every((p) => p.difficulty === expected)).toBe(true);

      const picks = getDailyPuzzles('2026-10-08', pool);
      expect(new Set(picks.map((p) => p.id)).size).toBe(3);
    }
  });

  it('asks the AI for harder bugs on the experienced track', () => {
    expect(aiDifficultyFor('new')).toBe(1);
    expect(aiDifficultyFor('experienced')).toBe(3);
  });

  it('resumes at the first unsolved puzzle', () => {
    const python = getPuzzlesByLanguage('python');
    expect(firstUnsolvedIndex(python, [])).toBe(0);
    expect(firstUnsolvedIndex(python, [python[0].id, python[1].id])).toBe(2);
    expect(firstUnsolvedIndex(python, python.map((p) => p.id))).toBe(0);
  });
});
