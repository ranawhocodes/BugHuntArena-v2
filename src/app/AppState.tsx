import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  loadSaveData,
  saveData,
  clearSaveData,
  purgeLegacySave,
  sanitizeSaveData,
} from '../storage/storage';
import { loadCloudSave, saveCloudData, clearCloudSave } from '../storage/cloudSync';
import { createInitialPlayerState } from '../storage/schema';
import type { PlayerSaveData, PetState, ExperienceLevel } from '../storage/schema';
import type { BugCategory } from '../content/types';
import {
  PET_FEED_COST,
  PET_FEED_COOLDOWN_MS,
  PET_MAX_STROKES_PER_DAY,
  DAILY_HISTORY_LIMIT,
  DAILY_PUZZLE_COUNT,
} from '../engine/constants';
import { updateStreak } from '../engine/engine';
import { useAuth } from '../auth/AuthContext';

interface AppStateContextValue {
  state: PlayerSaveData;
  syncing: boolean;
  setPlayerName: (name: string) => void;
  setExperience: (experience: ExperienceLevel) => void;
  recordPuzzleCompletion: (
    puzzleId: string,
    creatureId: string,
    category: BugCategory,
    xpEarned: number,
    bitsEarned: number,
    cleanCatch: boolean,
  ) => void;
  recordDailyClear: (date: string, puzzleId: string) => void;
  feedPet: () => { success: boolean; message: string };
  strokePet: () => { success: boolean; message: string };
  setPetCosmetic: (cosmetic: PetState['cosmetic']) => void;
  resetProgress: () => void;
  /** Writes the latest progress to the cloud immediately (used before signing out). */
  flushCloudSave: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

/** Debounce interval for cloud saves (ms) */
const CLOUD_SAVE_DEBOUNCE = 2000;

/**
 * Progress is always stored together with the id of the account it belongs to,
 * so one user's data can never be written into another user's local cache or cloud row.
 */
interface OwnedState {
  ownerId: string | null;
  data: PlayerSaveData;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const metadataName = (user?.user_metadata?.name as string | undefined)?.trim().slice(0, 40);

  const [store, setStore] = useState<OwnedState>(() => ({
    ownerId: userId,
    data: userId ? loadSaveData(userId) : createInitialPlayerState(),
  }));
  const [syncing, setSyncing] = useState<boolean>(Boolean(userId));
  /** Account whose cloud save has been reconciled; cloud writes wait for this. */
  const cloudReadyFor = useRef<string | null>(null);
  const latest = useRef(store);
  useEffect(() => {
    latest.current = store;
  }, [store]);

  // Reconcile this account's local cache with its cloud save. The provider is keyed by
  // user id (see App.tsx), so a different account always gets a fresh provider.
  useEffect(() => {
    purgeLegacySave();
    cloudReadyFor.current = null;
    if (!userId) return;

    let cancelled = false;

    loadCloudSave(userId).then((cloudRaw) => {
      if (cancelled) return;

      // Cloud data is external input: validate before trusting it.
      const cloud = sanitizeSaveData(cloudRaw);
      const chosen = cloud ?? loadSaveData(userId);
      const withName =
        metadataName && !chosen.playerName ? { ...chosen, playerName: metadataName } : chosen;

      setStore({ ownerId: userId, data: withName });
      saveData(userId, withName);
      if (!cloud) saveCloudData(userId, withName);

      cloudReadyFor.current = userId;
      setSyncing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, metadataName]);

  // Persist every change to the owner's local cache, and to the cloud (debounced).
  useEffect(() => {
    const { ownerId, data } = store;
    if (!ownerId) return;

    saveData(ownerId, data);
    if (cloudReadyFor.current !== ownerId) return;

    const timer = setTimeout(() => {
      saveCloudData(ownerId, data);
    }, CLOUD_SAVE_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [store]);

  const update = useCallback((fn: (prev: PlayerSaveData) => PlayerSaveData) => {
    setStore((prev) => {
      const next = fn(prev.data);
      return next === prev.data ? prev : { ...prev, data: next };
    });
  }, []);

  const flushCloudSave = useCallback(async () => {
    const { ownerId, data } = latest.current;
    if (ownerId && cloudReadyFor.current === ownerId) {
      await saveCloudData(ownerId, data);
    }
  }, []);

  const recordPuzzleCompletion = useCallback(
    (
      puzzleId: string,
      creatureId: string,
      category: BugCategory,
      xpEarned: number,
      bitsEarned: number,
      cleanCatch: boolean,
    ) => {
      update((prev) => {
        const date = today();
        const streakResult = updateStreak(
          prev.lastActiveDate,
          prev.streakDays,
          prev.streakFreezes,
          date,
        );

        const newCompleted = prev.completedPuzzleIds.includes(puzzleId)
          ? prev.completedPuzzleIds
          : [...prev.completedPuzzleIds, puzzleId];

        const newCreatures = prev.capturedCreatureIds.includes(creatureId)
          ? prev.capturedCreatureIds
          : [...prev.capturedCreatureIds, creatureId];

        const prevCat = prev.categoryStats[category] || {
          attempts: 0,
          mistakes: 0,
          cleanCatches: 0,
        };

        const updatedCat = {
          attempts: prevCat.attempts + 1,
          mistakes: cleanCatch ? prevCat.mistakes : prevCat.mistakes + 1,
          cleanCatches: cleanCatch ? prevCat.cleanCatches + 1 : prevCat.cleanCatches,
        };

        return {
          ...prev,
          xp: prev.xp + xpEarned,
          bugBits: prev.bugBits + bitsEarned,
          streakDays: streakResult.newStreak,
          streakFreezes: streakResult.freezesLeft,
          lastActiveDate: date,
          completedPuzzleIds: newCompleted,
          capturedCreatureIds: newCreatures,
          categoryStats: {
            ...prev.categoryStats,
            [category]: updatedCat,
          },
        };
      });
    },
    [update],
  );

  const recordDailyClear = useCallback(
    (date: string, puzzleId: string) => {
      update((prev) => {
        const cleared =
          prev.dailyProgress?.date === date ? prev.dailyProgress.clearedPuzzleIds : [];
        if (cleared.includes(puzzleId)) return prev;

        const nextCleared = [...cleared, puzzleId];
        const finishedToday =
          nextCleared.length >= DAILY_PUZZLE_COUNT && !prev.dailyCompletedDates.includes(date);

        return {
          ...prev,
          dailyProgress: { date, clearedPuzzleIds: nextCleared },
          dailyCompletedDates: finishedToday
            ? [...prev.dailyCompletedDates, date].slice(-DAILY_HISTORY_LIMIT)
            : prev.dailyCompletedDates,
        };
      });
    },
    [update],
  );

  const feedPet = useCallback((): { success: boolean; message: string } => {
    let result = { success: false, message: '' };

    update((prev) => {
      if (prev.bugBits < PET_FEED_COST) {
        result = { success: false, message: `Need ${PET_FEED_COST} Bug Bits to feed pet.` };
        return prev;
      }

      const now = Date.now();
      if (now - prev.pet.lastFedTimestamp < PET_FEED_COOLDOWN_MS) {
        result = { success: false, message: 'Your pet is still full! Try again later.' };
        return prev;
      }

      result = { success: true, message: 'Yum! Your pet is delighted (+20 Happiness).' };
      return {
        ...prev,
        bugBits: prev.bugBits - PET_FEED_COST,
        pet: {
          ...prev.pet,
          happiness: Math.min(100, prev.pet.happiness + 20),
          lastFedTimestamp: now,
        },
      };
    });

    return result;
  }, [update]);

  const strokePet = useCallback((): { success: boolean; message: string } => {
    let result = { success: false, message: '' };

    update((prev) => {
      const date = today();
      const isNewDay = prev.pet.lastStrokeDate !== date;
      const currentStrokes = isNewDay ? 0 : prev.pet.strokesToday;

      if (currentStrokes >= PET_MAX_STROKES_PER_DAY) {
        result = { success: false, message: 'Pet is satisfied for today!' };
        return prev;
      }

      result = { success: true, message: '*Purr* Pet loved that! (+1 Bug Bit)' };
      return {
        ...prev,
        bugBits: prev.bugBits + 1,
        pet: {
          ...prev.pet,
          happiness: Math.min(100, prev.pet.happiness + 5),
          strokesToday: currentStrokes + 1,
          lastStrokeDate: date,
        },
      };
    });

    return result;
  }, [update]);

  const setPetCosmetic = useCallback(
    (cosmetic: PetState['cosmetic']) => {
      update((prev) => ({ ...prev, pet: { ...prev.pet, cosmetic } }));
    },
    [update],
  );

  const setPlayerName = useCallback(
    (name: string) => {
      update((prev) => ({ ...prev, playerName: name.trim().slice(0, 40) }));
    },
    [update],
  );

  const setExperience = useCallback(
    (experience: ExperienceLevel) => {
      update((prev) => (prev.experience === experience ? prev : { ...prev, experience }));
    },
    [update],
  );

  const resetProgress = useCallback(() => {
    if (!userId) return;
    clearSaveData(userId);
    clearCloudSave(userId);
    // Keep who they are (name, chosen track); clear everything they've earned.
    update((prev) => ({
      ...createInitialPlayerState(),
      ...(prev.playerName ? { playerName: prev.playerName } : {}),
      ...(prev.experience ? { experience: prev.experience } : {}),
    }));
  }, [userId, update]);

  return (
    <AppStateContext.Provider
      value={{
        state: store.data,
        syncing,
        setPlayerName,
        setExperience,
        recordPuzzleCompletion,
        recordDailyClear,
        feedPet,
        strokePet,
        setPetCosmetic,
        resetProgress,
        flushCloudSave,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
