import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type GameState } from '../index';
import { takingsDue, takingsPerHour, visitorsPerHour, VENUE } from './venues';

const HOUR = 3_600_000;
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (urbs = 10_000, buildings: Building[] = [building(1, 'arcade', 55, 50), building(2, 'home', 52, 50, { tier: 4 })]): GameState => ({
  ...newGame({ seed: 'venues', now: 0 }), nextId: 100, urbs, tutorial: null, adaptationUntil: 0, buildings,
});
const send = (state: GameState, command: Command, now = 0) => {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const arcadeOf = (state: GameState) => state.buildings.find(b => b.type === 'arcade')!;
const machine = (x: number, y: number): Command => ({ type: 'PlaceFixture', buildingId: 1, fixture: 'arcadeMachine', x, y });

describe('Arcade Venue', () => {
  it('starts empty, with no Takings', () => {
    expect(arcadeOf(city()).venue).toEqual({ fixtures: [], nextFixtureId: 1, takings: 0 });
  });

  it('places a game machine on a free interior cell and pays its price', () => {
    const state = send(city(), machine(2, 3));
    expect(arcadeOf(state).venue!.fixtures).toEqual([{ id: 1, type: 'arcadeMachine', x: 2, y: 3, rotation: 0 }]);
    expect(state.urbs).toBe(10_000 - 150);
  });

  it('refuses a cell that is taken, outside the grid, or too expensive', () => {
    const placed = send(city(), machine(2, 3));
    expect(failure(placed, machine(2, 3))).toBe('error.tilesOccupied');
    expect(failure(city(), machine(6, 0))).toBe('error.tilesOccupied');
    expect(failure(city(), machine(-1, 0))).toBe('error.tilesOccupied');
    expect(failure(city(100), machine(0, 0))).toBe('error.notEnoughUrbs');
  });

  it('draws Visitors only from the Homes within reach', () => {
    const near = visitorsPerHour(city(), arcadeOf(city()));
    expect(near).toBeGreaterThan(0);
    const far = city(10_000, [building(1, 'arcade', 55, 50), building(2, 'home', 55 + VENUE.reachRadius + 20, 50, { tier: 4 })]);
    expect(visitorsPerHour(far, arcadeOf(far))).toBe(0);
  });

  it('earns nothing without a Fixture, then Visitors x play price up to its capacity', () => {
    const empty = city();
    expect(takingsPerHour(empty, arcadeOf(empty) as never)).toBe(0);
    const equipped = send(empty, machine(0, 0));
    const perHour = takingsPerHour(equipped, arcadeOf(equipped) as never);
    expect(perHour).toBeGreaterThan(0);
    expect(perHour).toBeLessThanOrEqual(6 * VENUE.playPrice);
  });

  it('accumulates Takings over time, capped, and collects them by hand', () => {
    const equipped = send(city(), machine(0, 0));
    const later = advance({ ...equipped, lastSeen: 0 }, 2 * HOUR).state;
    const due = takingsDue(arcadeOf(later).venue!);
    expect(due).toBeGreaterThan(0);
    const collected = send(later, { type: 'Collect', buildingId: 1 }, 2 * HOUR);
    expect(collected.urbs).toBe(later.urbs + due);
    expect(takingsDue(arcadeOf(collected).venue!)).toBe(0);
    expect(failure(collected, { type: 'Collect', buildingId: 1 })).toBe('error.nothingToCollect');

    const capped = advance({ ...equipped, lastSeen: 0 }, 40 * HOUR).state;
    expect(arcadeOf(capped).venue!.takings).toBeLessThanOrEqual(VENUE.takingsCap);
  });

  it('gives the same Takings whether replayed in one Catch-up or in steps', () => {
    const equipped = { ...send(city(), machine(0, 0)), lastSeen: 0 };
    const once = advance(equipped, 6 * HOUR).state;
    let stepped = equipped;
    for (let hour = 1; hour <= 6; hour++) stepped = advance(stepped, hour * HOUR).state;
    expect(arcadeOf(stepped).venue!.takings).toBeCloseTo(arcadeOf(once).venue!.takings, 6);
  });
});
