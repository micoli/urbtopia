import { describe, expect, it } from 'vitest';
import { BUILDING_ENTRIES } from '../buildings/buildingDefinitions';
import { dispatch, newGame } from '../index';
import { ANNUAL_EVENT_ENTRIES } from './annualEvents';
import { annualEventOf, annualEventsWithItems, isBuildableAt } from './annualEventItems';

const noon = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12).getTime();
const items = BUILDING_ENTRIES.filter(entry => entry.annualEvent);

describe('Annual event items', () => {
  it('sit in the Annual events section, and only they do', () => {
    expect(BUILDING_ENTRIES.filter(entry => entry.section === 'build.annualEvents').map(({ id }) => id)).toEqual(items.map(({ id }) => id));
  });

  it.each(items.map(({ id }) => id))('%s names a real event, costs 700 to 1500 Urbs, has no threshold, no road need and is never retired', id => {
    const entry = items.find(item => item.id === id)!;
    expect(ANNUAL_EVENT_ENTRIES.map(event => event.id)).toContain(entry.annualEvent);
    expect(entry.cost).toBeGreaterThanOrEqual(700);
    expect(entry.cost).toBeLessThanOrEqual(1500);
    expect(entry.unlockCitizens).toBe(0);
    expect(entry.requiresRoad).toBe(false);
    expect(entry.retired).toBeUndefined();
  });

  it('only Halloween, Autumn, Winter, Winter holidays, Spring, Summer, Easter and Midsummer have items for now', () => {
    expect([...annualEventsWithItems()]).toEqual(['halloween', 'autumn', 'winter', 'winterHolidays', 'spring', 'summer', 'easter', 'midsummer']);
  });

  it('can always be built when they belong to no event', () => {
    expect(annualEventOf('home')).toBeUndefined();
    expect(isBuildableAt('home', noon(2026, 8, 1))).toBe(true);
  });
});

describe('placing an Annual event item', () => {
  const rich = { ...newGame({ seed: 'annual-events', now: 0 }), tutorial: null, urbs: 100_000 };
  const place = (now: number) => dispatch(rich, { type: 'PlaceBuilding', buildingType: 'halloweenPumpkin', x: 56, y: 59 }, now);

  it('is refused outside the window of its event', () => {
    const result = place(noon(2026, 8, 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.key).toBe('error.annualEventClosed');
  });

  it('is accepted inside the window, and charges its price', () => {
    const result = place(noon(2026, 10, 31));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.urbs).toBe(100_000 - 700);
  });

  it('is judged on the date given, not on the game time held by the save', () => {
    const skipped = { ...rich, timeOffset: 90 * 24 * 60 * 60 * 1000 };
    const result = dispatch(skipped, { type: 'PlaceBuilding', buildingType: 'halloweenPumpkin', x: 56, y: 59 }, noon(2026, 8, 1));
    expect(result.ok).toBe(false);
  });

  it('leaves a placed item in the city once the window is closed', () => {
    const placed = place(noon(2026, 10, 31));
    if (!placed.ok) throw new Error('expected success');
    const later = dispatch(placed.state, { type: 'SellBuilding', id: placed.state.buildings.at(-1)!.id }, noon(2027, 3, 1));
    expect(later.ok).toBe(true);
  });
});
