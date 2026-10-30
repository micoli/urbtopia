import { describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameEvent, type GameState } from '../core';
import { createCommandGateway, tutorialEndToast } from './commandGateway';

const NOW = 1_700_000_000_000;

function city(): GameState {
  return { ...newGame({ now: NOW, seed: 'gateway' }), buildings: [createBuilding(10, 'shop', 65, 65, 0)], roads: [], roundabouts: [] };
}

function setup(options: { readOnly?: boolean; toast?: string | null } = {}) {
  const showToast = vi.fn();
  const gateway = createCommandGateway({
    isReadOnly: () => options.readOnly ?? false,
    now: () => NOW,
    toastForEvents: () => (options.toast ?? null) as never,
    showToast,
  });
  return { gateway, showToast };
}

describe('command gateway', () => {
  it('refuses every command in a read-only tab, without effects', () => {
    const { gateway, showToast } = setup({ readOnly: true, toast: 'event.storageFull' });
    const handler = vi.fn();
    gateway.onEvent('BuildingSold', handler);
    expect(gateway.apply(city(), { type: 'SellBuilding', id: 10 })).toEqual({ kind: 'blocked' });
    expect(handler).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('rejects a refused command without effects and hands the error back', () => {
    const { gateway, showToast } = setup({ toast: 'event.storageFull' });
    const handler = vi.fn();
    gateway.onEvent('BuildingSold', handler);
    const outcome = gateway.apply(city(), { type: 'SellBuilding', id: 999 });
    expect(outcome.kind).toBe('rejected');
    expect(handler).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('applies a command, shows the event toast and routes each event to its handlers', () => {
    const { gateway, showToast } = setup({ toast: 'event.storageFull' });
    const sold: GameEvent[] = [];
    const other = vi.fn();
    gateway.onEvent('BuildingSold', (event) => sold.push(event));
    gateway.onEvent('RoadBuilt', other);
    const state = city();
    const outcome = gateway.apply(state, { type: 'SellBuilding', id: 10 });
    expect(outcome.kind).toBe('applied');
    if (outcome.kind !== 'applied') return;
    expect(outcome.state.buildings).toEqual([]);
    expect(outcome.undo).not.toBeNull();
    expect(sold).toEqual([{ type: 'BuildingSold', id: 10 }]);
    expect(other).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('event.storageFull');
  });

  it('stops routing to a handler once it is disposed', () => {
    const { gateway } = setup();
    const handler = vi.fn();
    const dispose = gateway.onEvent('BuildingSold', handler);
    dispose();
    gateway.apply(city(), { type: 'SellBuilding', id: 10 });
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('tutorial end notice', () => {
  it('fires only when the tax step ends the Tutorial', () => {
    const state = city();
    expect(tutorialEndToast({ ...state, tutorial: 'tax' }, { ...state, tutorial: null })).toBe('tutorial.done');
    expect(tutorialEndToast({ ...state, tutorial: null }, { ...state, tutorial: null })).toBeNull();
    expect(tutorialEndToast({ ...state, tutorial: 'tax' }, { ...state, tutorial: 'tax' })).toBeNull();
  });
});

describe('command gateway and feature flags', () => {
  const gatewayWith = (enabled: boolean) => createCommandGateway({ isReadOnly: () => false, now: () => NOW, toastForEvents: () => null, showToast: vi.fn(), isCommandEnabled: command => command.type !== 'SellBuilding' || enabled });

  it('refuses a command of a feature that is off, without effects', () => {
    const handler = vi.fn();
    const gateway = gatewayWith(false);
    gateway.onEvent('BuildingSold', handler);
    expect(gateway.apply(city(), { type: 'SellBuilding', id: 10 })).toEqual({ kind: 'rejected', error: { key: 'error.unknownCommand' } });
    expect(handler).not.toHaveBeenCalled();
  });

  it('runs it once the feature is on, and never stops the others', () => {
    expect(gatewayWith(true).apply(city(), { type: 'SellBuilding', id: 10 }).kind).toBe('applied');
    expect(gatewayWith(false).apply(city(), { type: 'Collect', buildingId: 10 }).kind).not.toBe('blocked');
  });
});
