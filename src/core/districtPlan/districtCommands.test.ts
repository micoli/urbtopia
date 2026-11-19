import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../index';
import { giveUpDistrictGame, placeDistrictHex, startDistrictGame } from './districtCommands';
import type { CommandOutcome } from '../engine/commands';

const office = (tier = 1): Building => ({ ...createBuilding(7, 'planningOffice', 50, 50, 0), tier });
const city = (...buildings: Building[]): GameState => ({ ...newGame({ seed: 'district-commands', now: 0 }), buildings });

const stateOf = (outcome: CommandOutcome): GameState => {
  if ('key' in outcome) throw new Error(outcome.key);
  return outcome.state;
};

const districtOf = (state: GameState) => state.buildings.find(building => building.id === 7)!.district;

describe('the District plan commands', () => {
  it('start a game on the Planning office, with the Deck of its Tier', () => {
    const state = stateOf(startDistrictGame(city(office(3)), 7));
    expect(districtOf(state)).toMatchObject({ gameNumber: 1, game: { number: 1, deckSize: 32, placements: [{ cell: { q: 0, r: 0 }, rotation: 0 }] } });
  });

  it('place a Hex, then give up and keep the number', () => {
    const started = stateOf(startDistrictGame(city(office()), 7));
    const placed = stateOf(placeDistrictHex(started, 7, { q: 1, r: 0 }, 3));
    expect(districtOf(placed)!.game!.placements).toHaveLength(2);
    const gaveUp = stateOf(giveUpDistrictGame(placed, 7));
    expect(districtOf(gaveUp)).toEqual({ gameNumber: 1 });
  });

  it('change only the building they name', () => {
    const other = { ...createBuilding(8, 'home', 60, 60, 0) };
    const state = stateOf(startDistrictGame(city(office(), other), 7));
    expect(state.buildings.find(building => building.id === 8)).toBe(other);
  });

  it.each([
    { name: 'an unknown building', run: (state: GameState) => startDistrictGame(state, 99), key: 'error.unknownBuilding' },
    { name: 'a building that is not a Planning office', run: (state: GameState) => startDistrictGame({ ...state, buildings: [...state.buildings, createBuilding(8, 'home', 60, 60, 0)] }, 8), key: 'error.unknownBuilding' },
    { name: 'a game that is already under way', run: (state: GameState) => startDistrictGame(stateOf(startDistrictGame(state, 7)), 7), key: 'error.districtGameUnderWay' },
    { name: 'a Hex without a game', run: (state: GameState) => placeDistrictHex(state, 7, { q: 1, r: 0 }, 0), key: 'error.noDistrictGame' },
    { name: 'giving up without a game', run: (state: GameState) => giveUpDistrictGame(state, 7), key: 'error.noDistrictGame' },
    { name: 'a cell that touches nothing', run: (state: GameState) => placeDistrictHex(stateOf(startDistrictGame(state, 7)), 7, { q: 3, r: 0 }, 0), key: 'error.invalidDistrictPlacement' },
    { name: 'a rotation of 6', run: (state: GameState) => placeDistrictHex(stateOf(startDistrictGame(state, 7)), 7, { q: 1, r: 0 }, 6), key: 'error.unknownCommand' },
  ])('refuse $name with $key', ({ run, key }) => {
    expect(run(city(office()))).toEqual({ key });
  });
});
