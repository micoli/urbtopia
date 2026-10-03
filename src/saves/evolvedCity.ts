import { dispatch, newGame, type BuildingType, type Command, type GameState } from '../core';

export const EVOLVED_CITY_NOW = 1_790_000_000_000;

const ALL_GOODS = ['planks', 'bricks', 'tiles', 'tools', 'glass', 'circuits', 'steel', 'cement', 'jewelry', 'crystal'];

export function buildEvolvedCity(): GameState {
  const NOW = EVOLVED_CITY_NOW;
  let state: GameState = {
    ...newGame({ seed: 'golden-owl-1752', now: NOW }),
    urbs: 5_000_000,
    storage: { materials: {}, goods: Object.fromEntries(ALL_GOODS.map((good) => [good, 300])) },
  };
  const run = (command: Command): void => {
    const result = dispatch(state, command, NOW);
    if (!result.ok) throw new Error(`${JSON.stringify(command)} -> ${result.error.key}`);
    state = result.state;
  };
  const place = (buildingType: BuildingType, x: number, y: number, tier = 1): number => {
    run({ type: 'PlaceBuilding', buildingType, x, y });
    const id = state.nextId - 1;
    for (let t = 2; t <= tier; t++) run({ type: 'UpgradeBuilding', buildingId: id });
    return id;
  };

  for (const [x, y] of [[5, 3], [5, 4], [2, 3]] as const) run({ type: 'BuyParcel', x, y });
  run({ type: 'BuildRoad', from: { x: 49, y: 58 }, to: { x: 78, y: 58 } });
  run({ type: 'BuildRoad', from: { x: 49, y: 68 }, to: { x: 78, y: 68 } });
  run({ type: 'BuildRoad', from: { x: 49, y: 58 }, to: { x: 49, y: 68 }, horizontalFirst: false });
  run({ type: 'PlaceCrossing', x: 70, y: 58 });
  run({ type: 'PlaceRoundabout', x: 76, y: 63 });

  for (let i = 0; i < 5; i++) {
    place('powerPlant', 50 + i, 76, 3);
    place('waterTower', 50 + i, 78, 3);
  }

  for (const id of [1, 2]) for (let t = 2; t <= 5; t++) run({ type: 'UpgradeBuilding', buildingId: id });
  const workshops = [1, place('workshop', 50, 56, 5), place('workshop', 52, 56, 4), place('workshop', 64, 56, 3), place('workshop', 50, 66, 5), place('workshop', 52, 66, 2)];
  const factories = [2, place('factory', 56, 56, 5), place('factory', 58, 56, 4), place('factory', 62, 56, 3), place('factory', 54, 66, 5), place('factory', 56, 66, 4), place('factory', 58, 66, 2)];

  place('storehouse', 56, 59, 6);
  place('silo', 58, 59, 4);
  place('vault', 60, 59, 4);
  const shops = [62, 63, 64].map((x) => place('shop', x, 59));

  const homeTiers: [number, number, number][] = [
    [50, 59, 8], [52, 59, 8], [54, 59, 7], [66, 59, 6], [68, 59, 6], [70, 59, 5], [72, 59, 5],
    [50, 69, 4], [52, 69, 4], [54, 69, 3], [56, 69, 2], [58, 69, 2],
  ];
  for (const [x, y, tier] of homeTiers) place('home', x, y, tier);

  for (const id of [...workshops.slice(0, 3), ...factories.slice(0, 3)]) for (let s = 3; s <= 5; s++) run({ type: 'BuySlot', buildingId: id });
  for (const id of [workshops[0]!, factories[0]!]) for (let s = 6; s <= 8; s++) run({ type: 'BuySlot', buildingId: id });
  for (const id of shops) for (let s = 4; s <= 5; s++) run({ type: 'BuySlot', buildingId: id });

  state = {
    ...state,
    storage: {
      materials: { wood: 40, stone: 35, clay: 30, metal: 30, silicon: 12, sand: 14, coal: 10, gold: 8 },
      goods: { planks: 60, bricks: 45, tiles: 40, tools: 30, glass: 18, circuits: 16, steel: 14, cement: 20, jewelry: 8, crystal: 6 },
    },
  };
  run({ type: 'StockShop', buildingId: shops[0]!, good: 'tiles' });
  run({ type: 'StockShop', buildingId: shops[1]!, good: 'jewelry' });
  run({ type: 'StockShop', buildingId: shops[2]!, good: 'crystal' });
  for (const [id, item] of [[workshops[0]!, 'gold'], [workshops[0]!, 'sand'], [workshops[0]!, 'coal'], [workshops[1]!, 'silicon'], [workshops[4]!, 'metal']] as const)
    run({ type: 'QueueProduction', buildingId: id, item });
  for (const [id, item] of [[factories[0]!, 'crystal'], [factories[0]!, 'steel'], [factories[2]!, 'cement'], [factories[1]!, 'jewelry'], [factories[4]!, 'glass']] as const)
    run({ type: 'QueueProduction', buildingId: id, item });
  state = { ...state, urbs: 48_250, marketUnlocked: true, tutorial: null, lastSeen: NOW };

  return state;
}
