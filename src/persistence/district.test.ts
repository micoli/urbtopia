import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../core';
import type { DistrictGame, DistrictOffice } from '../core/districtPlan/districtGame';
import saveV19 from './fixtures/save-v19.json';
import { parseEnvelope, serializeEnvelope } from './envelope';

const game = (placements: DistrictGame['placements'], deckSize = placements.length, number = 1): DistrictGame => ({ number, deckSize, placements });

const START = { cell: { q: 0, r: 0 }, rotation: 0 };
const NEXT = { cell: { q: 1, r: 0 }, rotation: 2 };
const AFTER = { cell: { q: 1, r: -1 }, rotation: 5 };

const cityWith = (district: unknown, type: Building['type'] = 'planningOffice'): GameState => {
  const base = newGame({ seed: 'district-save', now: 0 });
  const office = { ...createBuilding(1, type, 50, 50, 0), district } as Building;
  return { ...base, nextId: 2, buildings: [office] };
};

const load = (district: unknown, type?: Building['type']) => parseEnvelope(serializeEnvelope(cityWith(district, type), 100));

describe('the games of a Planning office in the save', () => {
  it('loads a version-19 city with no office entry and nothing lost', () => {
    const loaded = parseEnvelope(JSON.stringify(saveV19));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings.some(building => building.district !== undefined)).toBe(false);
    expect(loaded.state).toEqual({ ...saveV19.state, achievements: ['housing.firstHome', 'housing.school', 'transport.firstRoad'], adaptationUntil: loaded.state.adaptationUntil });
  });

  it('round-trips a game under way with its best finished game', () => {
    const office: DistrictOffice = {
      gameNumber: 2,
      game: game([START, NEXT], 24, 2),
      best: { score: 41, game: game([START, NEXT, AFTER], 3, 1) },
    };
    const state = cityWith(office);
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100, prefs: {} });
  });

  it('round-trips an office that never played', () => {
    const state = cityWith({ gameNumber: 0 });
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100, prefs: {} });
  });

  it('keeps the Deck size of a game that began at a lower Tier', () => {
    const state = cityWith({ gameNumber: 1, game: game([START, NEXT], 24) });
    state.buildings = state.buildings.map(building => ({ ...building, tier: 3 }));
    const loaded = parseEnvelope(serializeEnvelope(state, 100));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings[0]!.district?.game?.deckSize).toBe(24);
  });

  it('never saves the bonus or the Rank', () => {
    const text = serializeEnvelope(cityWith({ gameNumber: 1, best: { score: 99, game: game([START, NEXT], 2) } }), 100);
    expect(text).not.toMatch(/bonus|rank|wellbeing/i);
  });

  it.each([
    { name: 'a negative game number', district: { gameNumber: -1 } },
    { name: 'a game that is not the last one started', district: { gameNumber: 2, game: game([START], 24, 1) } },
    { name: 'a game number beyond the last started', district: { gameNumber: 1, best: { score: 1, game: game([START], 1, 2) } } },
    { name: 'a Deck of no Hex', district: { gameNumber: 1, game: game([START], 0) } },
    { name: 'a Deck beyond the largest Tier', district: { gameNumber: 1, game: game([START], 41) } },
    { name: 'more Hexes placed than the Deck holds', district: { gameNumber: 1, game: game([START, NEXT, AFTER], 2) } },
    { name: 'no Hex placed', district: { gameNumber: 1, game: game([], 24) } },
    { name: 'a Start hex off the centre', district: { gameNumber: 1, game: game([{ cell: { q: 1, r: 0 }, rotation: 0 }], 24) } },
    { name: 'a turned Start hex', district: { gameNumber: 1, game: game([{ ...START, rotation: 1 }], 24) } },
    { name: 'a rotation of 6', district: { gameNumber: 1, game: game([START, { ...NEXT, rotation: 6 }], 24) } },
    { name: 'a fractional cell', district: { gameNumber: 1, game: game([START, { cell: { q: 0.5, r: 0 }, rotation: 0 }], 24) } },
    { name: 'a Hex that touches nothing', district: { gameNumber: 1, game: game([START, { cell: { q: 3, r: 0 }, rotation: 0 }], 24) } },
    { name: 'a Hex beyond the board', district: { gameNumber: 1, game: game([START, NEXT, { cell: { q: 2, r: 0 }, rotation: 0 }, { cell: { q: 3, r: 0 }, rotation: 0 }, { cell: { q: 4, r: 0 }, rotation: 0 }, { cell: { q: 5, r: 0 }, rotation: 0 }], 24) } },
    { name: 'two Hexes on one cell', district: { gameNumber: 1, game: game([START, NEXT, NEXT], 24) } },
    { name: 'a best game that was never finished', district: { gameNumber: 1, best: { score: 10, game: game([START, NEXT], 24) } } },
    { name: 'a fractional score', district: { gameNumber: 1, best: { score: 1.5, game: game([START], 1) } } },
    { name: 'a text instead of an office', district: 'nope' },
  ])('refuses $name', ({ district }) => {
    expect(load(district)).toMatchObject({ ok: false, reason: 'invalid-state' });
  });

  it('refuses the games of a building that is not a Planning office', () => {
    expect(load({ gameNumber: 0 }, 'home')).toMatchObject({ ok: false, reason: 'invalid-state' });
  });
});
