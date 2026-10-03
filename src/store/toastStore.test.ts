import { describe, expect, it } from 'vitest';
import { toastKeyForEvents } from './toastStore';

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

  it('announces an upgraded building', () => {
    expect(toastKeyForEvents([{ type: 'BuildingUpgraded', buildingId: 1, tier: 2 }])).toBe('event.buildingUpgraded');
  });

  it('stays silent for events that need no toast', () => {
    expect(toastKeyForEvents([{ type: 'BuildingPlaced', id: 1 }])).toBeNull();
    expect(toastKeyForEvents([])).toBeNull();
  });
});
