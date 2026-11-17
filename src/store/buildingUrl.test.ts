import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../core';

vi.stubGlobal('window', { location: { search: '' } });
const { createBuilding, newGame } = await import('../core');
const { applyBuildingTarget, currentBuildingTarget, readBuildingTarget, writeBuildingTarget } = await import('./buildingUrl');
const { gameStore } = await import('./gameStore');
const { uiStore } = await import('./uiStore');
const { venueStore } = await import('./venueStore');

describe('readBuildingTarget', () => {
  it('reads the building id and whether the interior is asked for', () => {
    expect(readBuildingTarget('?building=12&interior')).toEqual({ buildingId: 12, interior: true });
    expect(readBuildingTarget('?building=12')).toEqual({ buildingId: 12, interior: false });
    expect(readBuildingTarget('?building=12&interior=1')).toEqual({ buildingId: 12, interior: true });
  });

  it('ignores a missing, empty or non numeric id, and an interior switched off', () => {
    expect(readBuildingTarget('')).toEqual({ buildingId: null, interior: false });
    expect(readBuildingTarget('?building=&interior')).toEqual({ buildingId: null, interior: true });
    expect(readBuildingTarget('?building=abc')).toEqual({ buildingId: null, interior: false });
    expect(readBuildingTarget('?building=1.5')).toEqual({ buildingId: null, interior: false });
    expect(readBuildingTarget('?building=3&interior=false').interior).toBe(false);
    expect(readBuildingTarget('?building=3&interior=0').interior).toBe(false);
  });
});

describe('writeBuildingTarget', () => {
  it('keeps the other parameters, next to the position', () => {
    expect(writeBuildingTarget('?x=1&z=2&zoom=3', { buildingId: 7, interior: false })).toBe('?x=1&z=2&zoom=3&building=7');
    expect(writeBuildingTarget('?x=1&z=2&zoom=3', { buildingId: 7, interior: true })).toBe('?x=1&z=2&zoom=3&building=7&interior=');
  });

  it('removes both parameters when nothing is selected, and the interior when it is closed', () => {
    expect(writeBuildingTarget('?x=1&building=7&interior=', { buildingId: null, interior: false })).toBe('?x=1');
    expect(writeBuildingTarget('?building=7&interior=', { buildingId: 7, interior: false })).toBe('?building=7');
    expect(writeBuildingTarget('?building=7', { buildingId: null, interior: false })).toBe('');
  });
});

describe('applyBuildingTarget', () => {
  const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
  const city = (): GameState => ({ ...newGame({ seed: 'building-url', now: 0 }), buildings: [...homes, { ...createBuilding(1, 'farm', 55, 50, 0), tier: 2 }, { ...createBuilding(2, 'grainSilo', 60, 50, 0), tier: 1 }] });

  beforeEach(() => {
    gameStore.getState().replaceState(city(), 'tick');
    uiStore.getState().select(null);
    venueStore.getState().close();
  });

  afterEach(() => {
    uiStore.getState().select(null);
    venueStore.getState().close();
  });

  it('selects the building that the id names', () => {
    applyBuildingTarget('?building=2');
    expect(uiStore.getState().selectedBuildingId).toBe(2);
    expect(venueStore.getState().venueId).toBeNull();
  });

  it('opens the interior of a building that has one, when asked', () => {
    applyBuildingTarget('?building=1&interior');
    expect(uiStore.getState().selectedBuildingId).toBe(1);
    expect(venueStore.getState().venueId).toBe(1);
  });

  it('does not open the interior of a building that has none, but still selects it', () => {
    applyBuildingTarget('?building=2&interior');
    expect(uiStore.getState().selectedBuildingId).toBe(2);
    expect(venueStore.getState().venueId).toBeNull();
  });

  it('does not open an interior that is still locked', () => {
    gameStore.getState().replaceState({ ...city(), buildings: [{ ...createBuilding(1, 'farm', 55, 50, 0), tier: 2 }] }, 'tick');
    applyBuildingTarget('?building=1&interior');
    expect(uiStore.getState().selectedBuildingId).toBe(1);
    expect(venueStore.getState().venueId).toBeNull();
  });

  it('leaves everything as it was for an id that is not on the map, or no id', () => {
    applyBuildingTarget('?building=999&interior');
    applyBuildingTarget('?interior');
    applyBuildingTarget('');
    expect(uiStore.getState().selectedBuildingId).toBeNull();
    expect(venueStore.getState().venueId).toBeNull();
  });

  it('is written back as the target of the URL: the interior that is open, or else the selection', () => {
    expect(currentBuildingTarget()).toEqual({ buildingId: null, interior: false });
    applyBuildingTarget('?building=2');
    expect(currentBuildingTarget()).toEqual({ buildingId: 2, interior: false });
    applyBuildingTarget('?building=1&interior');
    expect(currentBuildingTarget()).toEqual({ buildingId: 1, interior: true });
  });
});
