import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, previewCommand, solarInstallCostOf, type Command, type GameState } from '..';

const state: GameState = newGame({ seed: 'amber-fox-4821', now: 0 });
const poor: GameState = { ...state, urbs: 0 };

const commands: Command[] = [
  { type: 'BuildRoad', from: { x: 50, y: 50 }, to: { x: 53, y: 50 }, horizontalFirst: true },
  { type: 'BuildPedestrianWay', from: { x: 50, y: 52 }, to: { x: 53, y: 52 }, horizontalFirst: true },
  { type: 'PlaceBuilding', buildingType: 'shopConstruction', x: 56, y: 57, rotation: 2 },
  { type: 'PlaceBuilding', buildingType: 'shopConstruction', x: 70, y: 70, rotation: 0 },
  { type: 'SellBuilding', id: 999 },
  { type: 'BuyParcel', x: 99, y: 99 },
];

describe('previewCommand', () => {
  it.each(commands)('agrees with dispatch on whether %j is refused, and why', (command) => {
    const result = dispatch(state, command, state.lastSeen);
    expect(previewCommand(state, command).error).toBe(result.ok ? null : result.error.key);
  });

  it('prices an accepted command from what it takes out of the city', () => {
    const command = commands[0]!;
    const result = dispatch(state, command, state.lastSeen);
    if (!result.ok) throw new Error('expected the road to be accepted');
    expect(previewCommand(state, command)).toEqual({ error: null, cost: state.urbs - result.state.urbs });
  });

  it('still gives the price when the city cannot afford it', () => {
    const accepted = previewCommand(state, commands[0]!);
    expect(previewCommand(poor, commands[0]!)).toEqual({ error: 'error.notEnoughUrbs', cost: accepted.cost });
  });

  it('gives no price when the command is refused for another reason', () => {
    expect(previewCommand(state, commands[3]!)).toEqual({ error: 'error.needsAccess', cost: null });
  });

  it('is free for a command that earns Urbs, and leaves the state alone', () => {
    const before = JSON.stringify(state);
    const sale = previewCommand(state, { type: 'SellBuilding', id: state.buildings[0]!.id });
    expect(sale).toEqual({ error: null, cost: 0 });
    expect(JSON.stringify(state)).toBe(before);
  });

  it('prices a road upgrade like the command charges it', () => {
    const roads = state.roads.slice(0, 2);
    const command: Command = { type: 'UpgradeRoads', tiles: roads.map(({ x, y }) => ({ x, y })) };
    const result = dispatch(state, command, state.lastSeen);
    if (!result.ok) throw new Error('expected the upgrade to be accepted');
    expect(previewCommand(state, command).cost).toBe(state.urbs - result.state.urbs);
  });
});

describe('solar Home price', () => {
  const homes = Array.from({ length: 18 }, (_, i) => createBuilding(20 + i, 'home', 20 + (i % 6) * 4, 30 + Math.floor(i / 6) * 4, 0));
  const utilities = [0, 1, 2].flatMap((i) => [createBuilding(40 + i, 'powerPlant', 20 + i * 5, 46, 0), createBuilding(50 + i, 'waterTower', 20 + i * 5, 50, 0)]);
  const city: GameState = { ...state, urbs: 1_000_000, nextId: 80, buildings: [...state.buildings, ...homes, ...utilities] };
  const place: Command = { type: 'PlaceBuilding', buildingType: 'home', x: 56, y: 57, rotation: 2 };

  it('adds the install cost the command charges', () => {
    const plain = previewCommand(city, place);
    const solar = previewCommand(city, { ...place, solar: true });
    expect(plain.error).toBeNull();
    expect(solar.error).toBeNull();
    expect(solar.cost! - plain.cost!).toBe(solarInstallCostOf('home'));
  });
});
