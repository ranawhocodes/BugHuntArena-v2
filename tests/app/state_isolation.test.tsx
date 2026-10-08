import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppStateProvider, useAppState } from '../../src/app/AppState';
import { saveData, loadSaveData, storageKeyFor } from '../../src/storage/storage';
import { createInitialPlayerState } from '../../src/storage/schema';

// tests/setup.ts signs everyone in as 'test-user-id'
const SIGNED_IN = 'test-user-id';

function Probe() {
  const { state, syncing } = useAppState();
  return (
    <p>
      {syncing ? 'syncing' : 'ready'} xp={state.xp} name={state.playerName ?? 'none'}
    </p>
  );
}

describe('AppStateProvider account isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not load another account's cached progress", async () => {
    saveData('someone-else', { ...createInitialPlayerState(), xp: 777, playerName: 'Mallory' });

    render(
      <AppStateProvider>
        <Probe />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByText(/ready/)).toBeInTheDocument());
    expect(screen.getByText(/xp=0/)).toBeInTheDocument();
    expect(screen.queryByText(/Mallory/)).not.toBeInTheDocument();
    // The other account's cache is untouched
    expect(loadSaveData('someone-else').xp).toBe(777);
  });

  it("loads the signed-in account's own cached progress and saves under its own key", async () => {
    saveData(SIGNED_IN, { ...createInitialPlayerState(), xp: 120 });

    render(
      <AppStateProvider>
        <Probe />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByText(/ready/)).toBeInTheDocument());
    expect(screen.getByText(/xp=120/)).toBeInTheDocument();
    expect(localStorage.getItem(storageKeyFor(SIGNED_IN))).toContain('"xp":120');
  });
});
