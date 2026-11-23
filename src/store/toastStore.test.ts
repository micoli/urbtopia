import { afterEach, describe, expect, it } from 'vitest';
import { newGame, type GameEvent } from '../core';
import { announceEvents, announceMedal, toastKeyForEvents, toastStore } from './toastStore';

describe('toastKeyForEvents', () => {
  it('tells the player when offline time was forfeited, before anything else', () => {
    expect(
      toastKeyForEvents([
        { type: 'ProductionCompleted', buildingId: 1, item: 'wood', at: 0 },
        { type: 'OfflineTimeCapped', forfeitedMs: 1 },
      ]),
    ).toBe('event.offlineTimeCapped');
  });

  it('reports a full Storehouse, then completed production', () => {
    expect(toastKeyForEvents([{ type: 'StorageFull', buildingId: 1 }])).toBe('event.storageFull');
    expect(toastKeyForEvents([{ type: 'ProductionCompleted', buildingId: 1, item: 'wood', at: 0 }])).toBe('event.productionCompleted');
  });

  it('announces a newly unlocked Public facility before the upgrade message', () => {
    expect(toastKeyForEvents([{ type: 'BuildingUpgraded', buildingId: 1, tier: 2 }, { type: 'FacilityUnlocked', facility: 'school' }])).toBe('event.unlocked.school');
  });

  it('announces the unlock of the Office', () => {
    expect(toastKeyForEvents([{ type: 'FacilityUnlocked', facility: 'office' }])).toBe('event.unlocked.office');
  });

  it('announces an upgraded building', () => {
    expect(toastKeyForEvents([{ type: 'BuildingUpgraded', buildingId: 1, tier: 2 }])).toBe('event.buildingUpgraded');
  });

  it('tells the player what the Council decided and when Grants were collected', () => {
    expect(toastKeyForEvents([{ type: 'OrdinanceAdopted', id: 'greenBelt' }])).toBe('event.ordinanceAdopted');
    expect(toastKeyForEvents([{ type: 'OrdinanceRejected', id: 'greenBelt' }])).toBe('event.ordinanceRejected');
    expect(toastKeyForEvents([{ type: 'OrdinanceRepealed', id: 'greenBelt' }])).toBe('event.ordinanceRepealed');
    expect(toastKeyForEvents([{ type: 'GrantsClaimed', amount: 300 }])).toBe('event.grantsClaimed');
  });

  it('stays silent for events that need no toast', () => {
    expect(toastKeyForEvents([{ type: 'BuildingPlaced', id: 1 }])).toBeNull();
    expect(toastKeyForEvents([])).toBeNull();
  });
});

describe('Achievement toasts', () => {
  afterEach(() => toastStore.getState().dismiss());
  const unlocked = (id: string): GameEvent => ({ type: 'AchievementUnlocked', id });
  const state = newGame({ seed: 'amber-fox-4821', now: 1_700_000_000_000 });

  it('names the Achievement just earned, with a trophy', () => {
    announceEvents([unlocked('transport.bridge')], state);
    expect(toastStore.getState().text).toBe('Achievement: Bridge builder');
    expect(toastStore.getState().icon).toBe('trophy');
  });

  it('groups several Achievements earned together into one toast', () => {
    announceEvents([unlocked('transport.bridge'), unlocked('transport.busLine')], state);
    expect(toastStore.getState().text).toBe('2 Achievements unlocked');
  });

  it('shows the Medal of a category with its own Icon', () => {
    announceMedal('transport');
    expect(toastStore.getState().text).toBe('Medal earned: Transport');
    expect(toastStore.getState().icon).toBe('medal');
  });
});
