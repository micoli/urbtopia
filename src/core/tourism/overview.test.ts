import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../index';
import { HOTEL, cityAttractiveness } from '../venues/hotel';
import { attractionTakingsCapOf } from './takings';
import { nextAttractionType, tourismOverview } from './overview';

const city = (...buildings: Building[]): GameState => ({ ...newGame({ seed: 'overview', now: 0 }), urbs: 0, tutorial: null, adaptationUntil: 0, lastSeen: 0, buildings });
const museum = (id: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, 'masMuseum', 10 * id, 10, 0), ...extra });

describe('tourismOverview', () => {
  it('adds up the Tourists, the earnings and the Takings of the Attractions only', () => {
    const overview = tourismOverview(city(museum(1, { attraction: { takings: 12.8 } }), museum(2, { attraction: { takings: 3 } }), createBuilding(3, 'home', 40, 10, 0)));
    expect(overview.rows).toHaveLength(2);
    expect(overview.toCollect).toBe(15);
    expect(overview.touristsPerDay).toBeGreaterThan(0);
    expect(overview.perHour).toBeGreaterThan(0);
  });

  it('lists the fullest Takings first and says when they fill up', () => {
    const near = museum(1, { attraction: { takings: 1 } });
    const full = museum(2, { attraction: { takings: attractionTakingsCapOf(museum(2)) } });
    const overview = tourismOverview(city(near, full));
    expect(overview.rows[0]!.building.id).toBe(2);
    expect(overview.rows[0]!.full).toBe(true);
    expect(overview.rows[0]!.hoursToFull).toBeNull();
    expect(overview.rows[1]!.hoursToFull).toBeGreaterThan(0);
    expect(overview.advice[0]).toEqual({ kind: 'collect', buildingId: 2, count: 1 });
  });

  it('lists an Arena with no cap, no Tourists a day and its Takings to collect', () => {
    const overview = tourismOverview(city(createBuilding(1, 'concertHall', 10, 10, 0), { ...createBuilding(2, 'stadium', 40, 10, 0), attraction: { takings: 5000 } }));
    expect(overview.rows).toHaveLength(2);
    expect(overview.touristsPerDay).toBe(0);
    expect(overview.perHour).toBe(0);
    expect(overview.rows.every(row => !row.full && row.hoursToFull === null)).toBe(true);
    expect(overview.advice).toContainEqual({ kind: 'collectArena', buildingId: 2, count: 1 });
    expect(overview.advice.map(advice => advice.kind)).not.toContain('collect');
  });

  it('only suggests an Attraction as the next building', () => {
    expect(['theater', 'concertHall', 'stadium', 'footballStadium', 'baseballField']).not.toContain(nextAttractionType(city()));
  });

  it('asks for a Hotel until the city has one', () => {
    const kinds = (state: GameState) => tourismOverview(state).advice.map(advice => advice.kind);
    expect(kinds(city(museum(1)))).toContain('hotel');
    expect(kinds(city(museum(1), createBuilding(2, 'hotel', 40, 10, 0)))).not.toContain('hotel');
  });

  it('suggests a Show that would pay', () => {
    const advice = tourismOverview(city(createBuilding(1, 'theater', 10, 10, 0), createBuilding(2, 'home', 16, 10, 0))).advice.find(item => item.kind === 'show');
    expect(advice).toMatchObject({ kind: 'show', buildingId: 1 });
  });

  it('does not suggest a Show during the cooldown', () => {
    const theater = { ...createBuilding(1, 'theater', 10, 10, 0), attraction: { takings: 0, cooldownUntil: 1000 } };
    expect(tourismOverview(city(theater)).advice.map(advice => advice.kind)).not.toContain('show');
  });

  it('has no advice without an Attraction', () => {
    expect(tourismOverview(city()).advice).toEqual([]);
  });
});

describe('nextAttractionType', () => {
  it('aims at the first Attraction to unlock, then the cheapest once unlocked', () => {
    expect(nextAttractionType(city())).toBe('marina');
    const home = createBuilding(1, 'home', 10, 10, 0);
    expect(nextAttractionType(city({ ...home, type: 'marina' }))).not.toBe('marina');
  });
});

describe('cityAttractiveness', () => {
  it('counts every Attraction as a leisure place', () => {
    const none = cityAttractiveness(city());
    expect(cityAttractiveness(city(museum(1)))).toBeGreaterThan(none);
    expect(cityAttractiveness(city(...Array.from({ length: HOTEL.attractiveCount + 2 }, (_, index) => museum(index + 1))))).toBe(1);
  });
});
