import { afterEach, describe, expect, it, vi } from 'vitest';
import { difficultyOf, newGame, type GameState } from '../core';
import { readOnlyStore } from './readOnlyStore';

vi.stubGlobal('window', { location: { search: '' } });
const { createGameStore } = await import('./gameStore');
const NOW = 1_700_000_000_000;

function initial(): GameState {
  return { ...newGame({ now: NOW, seed: 'store' }), buildings: [], roads: [], roundabouts: [] };
}

afterEach(() => {
  vi.restoreAllMocks();
  readOnlyStore.getState().set(false);
});

describe('new game Difficulty', () => {
  it('starts a new city on the chosen Difficulty, Cozy by default', () => {
    const store = createGameStore(initial());
    store.getState().newGame(NOW, 'hard');
    expect(difficultyOf(store.getState().state)).toBe('hard');
    store.getState().newGame(NOW);
    expect(difficultyOf(store.getState().state)).toBe('cozy');
  });

  it('changes the Difficulty of the current city at any time', () => {
    const store = createGameStore(initial());
    store.getState().send({ type: 'SetDifficulty', difficulty: 'medium' });
    expect(difficultyOf(store.getState().state)).toBe('medium');
  });
});
