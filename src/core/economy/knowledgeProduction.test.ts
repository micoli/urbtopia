import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { KNOWLEDGE, advance, cityKnowledge, createBuilding, dispatch, officeYieldMultiplierOf, newGame, type Building, type Command, type GameState } from '../index';
import { knowledgeCurve } from '../services/knowledge';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const original = { ...KNOWLEDGE.effects };
afterEach(() => {
  Object.assign(KNOWLEDGE.effects, original);
});

const b = (id: number, type: Building['type'], x: number, y = 0): Building => createBuilding(id, type, x + 50, y + 50, 0);
const succeed = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};

// Adaptation keeps the economic ratio at 1, so only Knowledge changes the pace.
function schooledCity(): GameState {
  const base = newGame({ seed: 'amber-fox-4821', now: T0 });
  return { ...base, adaptationUntil: T0 + 1000 * MINUTE, nextId: 500, buildings: [...base.buildings, b(500, 'school', 0, 20), { ...b(501, 'library', 5, 20), tier: 5 }, b(502, 'home', 3, 20)] };
}

describe('Knowledge and production', () => {
  const state = schooledCity();
  const queued = succeed(state, { type: 'QueueProduction', buildingId: 1, item: 'wood' });
  const doneAt = (at: number, from: GameState) => advance(from, at).state.buildings.find(building => building.id === 1)!.queue[0]!.done;

  it('speeds an Industry building up by the effect', () => {
    const speed = 1 + KNOWLEDGE.effects.production * knowledgeCurve(cityKnowledge(queued)!);
    expect(speed).toBeGreaterThan(1.05);
    const early = T0 + Math.ceil(MINUTE / speed) + 5;
    expect(doneAt(early, queued)).toBe(true);
    expect(doneAt(T0 + Math.floor(MINUTE / speed) - 5, queued)).toBe(false);
  });

  it('leaves the pace alone when the effect is nil', () => {
    KNOWLEDGE.effects.production = 0;
    expect(doneAt(T0 + MINUTE - 5, queued)).toBe(false);
    expect(doneAt(T0 + MINUTE, queued)).toBe(true);
  });

  it('gives the same result in one step or in many', () => {
    const once = advance(queued, T0 + 2 * MINUTE).state;
    let stepped = queued;
    for (let minute = 1; minute <= 4; minute++) stepped = advance(stepped, T0 + (minute * MINUTE) / 2).state;
    expect(stepped.buildings.find(building => building.id === 1)!.queue[0]).toEqual(once.buildings.find(building => building.id === 1)!.queue[0]);
  });
});

describe('Knowledge and Offices', () => {
  it('multiplies the Urbs of the Jobs by the effect', () => {
    const state = schooledCity();
    const expected = 1 + KNOWLEDGE.effects.office * knowledgeCurve(cityKnowledge(state)!);
    expect(officeYieldMultiplierOf(state)).toBeCloseTo(expected, 8);
  });

  it('does nothing without Knowledge', () => {
    expect(officeYieldMultiplierOf(newGame({ seed: 'none', now: T0 }))).toBe(1);
  });
});
