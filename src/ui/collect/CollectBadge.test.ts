import { describe, expect, it, vi } from 'vitest';
import { createBuilding } from '../../core';
import { collectBadgeLabel } from './CollectBadge';

vi.mock('../../i18n/prefsStore', () => ({ prefsStore: {} }));
vi.mock('../../store/gameStore', () => ({ gameStore: {} }));
vi.mock('../common/useProjectedPosition', () => ({ useProjectedPosition: () => undefined }));
vi.mock('../common/UrbsAmount.tsx', () => ({ UrbsAmount: () => null }));
vi.mock('./ItemThumbnail', () => ({ ItemThumbnail: () => null }));
vi.mock('./collectSweep', () => ({ registerCollector: () => undefined, startSweep: () => undefined }));

const attraction = (type: 'masMuseum' | 'footballStadium' | 'concertHall' | 'casino', takings?: number) => ({ ...createBuilding(1, type, 60, 60, 0), ...(takings === undefined ? {} : { attraction: { takings } }) });

describe('collectBadgeLabel for Attractions', () => {
  it.each(['masMuseum', 'footballStadium', 'concertHall', 'casino'] as const)('shows the whole Urbs of the Takings of a %s', type => {
    expect(collectBadgeLabel(attraction(type, 42.9))).toBe(42);
  });

  it('shows nothing while the Takings are under one Urb, or a building has none', () => {
    expect(collectBadgeLabel(attraction('masMuseum', 0.8))).toBeNull();
    expect(collectBadgeLabel(attraction('masMuseum'))).toBeNull();
  });

  it('is a number, so the tax badge setting hides it with the other Urbs badges', () => {
    expect(typeof collectBadgeLabel(attraction('masMuseum', 10))).toBe('number');
  });
});
