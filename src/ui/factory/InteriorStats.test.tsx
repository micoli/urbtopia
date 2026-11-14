import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createBuilding, type Building, type VenueFixture } from '../../core';
import { formatPercent } from './formatPercent';
import { InteriorStats } from './InteriorStats';

vi.mock('../common/UrbsStat', () => ({ UrbsStat: () => null }));

const fixture = (id: number, type: VenueFixture['type'], x: number, y: number, rotation: VenueFixture['rotation']): VenueFixture => ({ id, type, x, y, rotation });

const storehouse = (breakerOff: boolean): Building => ({
  ...createBuilding(1, 'storehouse', 55, 50, 0),
  tier: 5,
  interior: {
    nextFixtureId: 8,
    staff: { stocker: 2 },
    fixtures: [
      fixture(1, 'storehouseDock', 4, 0, 0), fixture(2, 'storehouseShaft', 5, 0, 1), fixture(3, 'storehouseMotor', 6, 0, 1), fixture(4, 'storehouseConveyor', 4, 1, 0),
      fixture(5, 'storehouseHoist', 4, 2, 0), fixture(6, 'storehouseShaft', 5, 2, 1), fixture(7, 'storehouseMotor', 6, 2, 1), fixture(8, 'storehouseConveyor', 4, 3, 0),
      fixture(9, 'storehouseConveyor', 4, 4, 0), fixture(10, 'storehouseConveyor', 4, 5, 0), fixture(11, 'storehouseConveyor', 4, 6, 0), fixture(12, 'storehouseRack', 4, 7, 2),
    ],
  },
  ...(breakerOff ? { breakerOff: true } : {}),
});

describe('InteriorStats', () => {
  it('shows the room the Racks add while the breaker is on, and nothing once it is off', () => {
    expect(renderToStaticMarkup(<InteriorStats factory={storehouse(false)} />)).not.toContain(formatPercent(0));
    expect(renderToStaticMarkup(<InteriorStats factory={storehouse(true)} />)).toContain(formatPercent(0));
  });
});
