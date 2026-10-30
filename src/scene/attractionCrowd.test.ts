import { describe, expect, it } from 'vitest';
import { CROWD_WINDOW_MS, createBuilding } from '../core';
import { CROWD, crowdPresence, crowdSlots, gatheringFigures, visitorFigures } from './attractionCrowd';

const museum = createBuilding(7, 'masMuseum', 10, 20, 0);

describe('crowdPresence', () => {
  const gathering = { startsAt: 10 * CROWD_WINDOW_MS, endsAt: 13 * CROWD_WINDOW_MS };
  it('builds up in the hour before, stays, and thins out in the hour after', () => {
    expect(crowdPresence(gathering, 8 * CROWD_WINDOW_MS)).toBe(0);
    expect(crowdPresence(gathering, 9.5 * CROWD_WINDOW_MS)).toBeCloseTo(0.5);
    expect(crowdPresence(gathering, 11 * CROWD_WINDOW_MS)).toBe(1);
    expect(crowdPresence(gathering, 13.5 * CROWD_WINDOW_MS)).toBeCloseTo(0.5);
    expect(crowdPresence(gathering, 14 * CROWD_WINDOW_MS)).toBe(0);
  });
});

describe('figures', () => {
  it('caps the crowd drawn for a Gathering', () => {
    expect(gatheringFigures(40)).toBe(20);
    expect(gatheringFigures(100_000)).toBe(CROWD.figuresPerGathering);
  });

  it('keeps at least one visitor at an Attraction that draws Tourists, and few of them', () => {
    expect(visitorFigures(0)).toBe(0);
    expect(visitorFigures(0.5)).toBe(1);
    expect(visitorFigures(100_000)).toBe(CROWD.maxVisitors);
  });
});

describe('crowdSlots', () => {
  it('gives the same building the same places', () => {
    expect(crowdSlots(museum, new Set(), 20, 5)).toEqual(crowdSlots(museum, new Set(), 20, 5));
  });

  it('stays outside the footprint and close to it', () => {
    for (const slot of crowdSlots(museum, new Set(), 50, 5)) {
      const inside = slot.x > 10 && slot.x < 13 && slot.z > 20 && slot.z < 23;
      expect(inside).toBe(false);
      expect(Math.abs(slot.x - 11.5)).toBeLessThan(1.5 + CROWD.margin + CROWD.spread + 0.01);
      expect(Math.abs(slot.z - 21.5)).toBeLessThan(1.5 + CROWD.margin + CROWD.spread + 0.01);
    }
  });

  it('avoids the tiles of other buildings when it can', () => {
    const blocked = new Set<string>();
    for (let x = 0; x < 40; x++) for (let z = 0; z < 40; z++) if (x < 10) blocked.add(`${x},${z}`);
    const slots = crowdSlots(museum, blocked, 40, 5);
    expect(slots.filter(slot => slot.x < 10).length).toBeLessThan(2);
  });
});
