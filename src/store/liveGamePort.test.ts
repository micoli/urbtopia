import { describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../core';
import { createCommandGateway } from './commandGateway';
import { createLiveGamePort } from './liveGamePort';

vi.stubGlobal('window', { location: { search: '' } });
const { createGameStore } = await import('./gameStore');
const NOW = 1_700_000_000_000;

function setup(readOnly = false) {
  const showToast = vi.fn();
  const persist = vi.fn();
  const gateway = createCommandGateway({ isReadOnly: () => readOnly, now: () => NOW, toastForEvents: () => 'event.storageFull', showToast });
  const state: GameState = { ...newGame({ now: NOW, seed: 'port' }), buildings: [createBuilding(10, 'shop', 65, 65, 0)], roads: [], roundabouts: [] };
  const store = createGameStore(state, gateway);
  return { port: createLiveGamePort({ store, gateway, persist }), store, showToast, persist };
}

describe('live game port', () => {
  it('applies a command through the gateway and replaces the state without an undo', () => {
    const { port, store, showToast } = setup();
    expect(port.apply({ type: 'SellBuilding', id: 10 })).toBeNull();
    expect(store.getState().state.buildings).toEqual([]);
    expect(store.getState().deletionUndo).toBeNull();
    expect(showToast).toHaveBeenCalledWith('event.storageFull');
  });

  it('hands the error key back instead of showing a toast', () => {
    const { port, store, showToast } = setup();
    expect(port.apply({ type: 'SellBuilding', id: 999 })).toBe('error.unknownBuilding');
    expect(store.getState().state.buildings).toHaveLength(1);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('refuses in a read-only tab and leaves the state alone', () => {
    const { port, store } = setup(true);
    expect(port.apply({ type: 'SellBuilding', id: 10 })).not.toBeNull();
    expect(store.getState().state.buildings).toHaveLength(1);
  });

  it('persists on demand', () => {
    const { port, persist } = setup();
    port.persist();
    expect(persist).toHaveBeenCalledOnce();
  });
});
