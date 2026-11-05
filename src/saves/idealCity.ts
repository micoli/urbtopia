import { dispatch, footprintOf, newGame, type BuildingType, type Command, type GameState } from '../core';

export const IDEAL_CITY_NOW = 1_790_000_000_000;

const ALL_GOODS = ['planks', 'bricks', 'tiles', 'tools', 'glass', 'circuits', 'steel', 'cement', 'jewelry', 'crystal'];

const ROAD_NORTH = 56;
const ROAD_MIDDLE = 62;
const ROAD_SOUTH = 68;
const WEST = 49;
const EAST = 78;
const CENTER = 64;

const goodsOf = (quantity: number): GameState['storage'] => ({ materials: {}, goods: Object.fromEntries(ALL_GOODS.map((good) => [good, quantity])) });

// 2000 Citizens: compact mid-rise Homes on three streets, a Park or Tree within a few tiles of every Home, every Service
// covered from the west and from the east, Geothermal and wind power and clean Waste recycling.
export function buildIdealCity(): GameState {
  const NOW = IDEAL_CITY_NOW;
  let state: GameState = newGame({ seed: 'green-heron-2000', now: NOW });
  const run = (command: Command): void => {
    const result = dispatch(state, command, NOW);
    if (!result.ok) throw new Error(`${JSON.stringify(command)} -> ${result.error.key}`);
    state = result.state;
  };
  const place = (buildingType: BuildingType, x: number, y: number, tier = 1, rotation: 0 | 2 = 0): number => {
    run({ type: 'PlaceBuilding', buildingType, x, y, rotation });
    const buildingId = state.nextId - 1;
    for (let t = 2; t <= tier; t++) run({ type: 'UpgradeBuilding', buildingId });
    return buildingId;
  };
  const placeFacingSouthRoad = (buildingType: BuildingType, x: number, roadY: number, tier = 1): number => {
    const { depth } = footprintOf(buildingType, 2);
    return place(buildingType, x, roadY - depth, tier, 2);
  };

  for (const id of [1, 2]) run({ type: 'SellBuilding', id });
  run({ type: 'DemolishRoadPath', from: { x: 53, y: 58 }, to: { x: 62, y: 58 } });
  state = { ...state, urbs: 5_000_000, storage: goodsOf(2000) };

  for (const y of [ROAD_NORTH, ROAD_MIDDLE, ROAD_SOUTH]) run({ type: 'BuildRoad', from: { x: WEST, y }, to: { x: EAST, y } });
  run({ type: 'BuildRoad', from: { x: WEST, y: ROAD_NORTH }, to: { x: WEST, y: ROAD_SOUTH }, horizontalFirst: false });
  run({ type: 'BuildRoad', from: { x: CENTER, y: ROAD_NORTH }, to: { x: CENTER, y: ROAD_SOUTH }, horizontalFirst: false });

  for (let i = 0; i < 6; i++) place('waterTower', 50 + i, 73, 3);
  const windTurbines = [0, 1, 2, 3, 4].map((i) => place('powerPlant', 50 + i, 75, 3));

  const northHomes: [number, number][] = [[51, 5], [54, 6], [57, 7], [60, 7], [66, 7], [69, 7], [72, 6], [75, 5]];
  const southHomes: [number, number][] = [[51, 6], [54, 6], [57, 5], [60, 4]];
  const homes = [
    ...northHomes.map(([x, tier]) => ({ id: place('home', x, ROAD_NORTH + 1), tier })),
    ...southHomes.map(([x, tier]) => ({ id: place('home', x, ROAD_MIDDLE + 1), tier })),
  ];
  state = { ...state, buildings: state.buildings.map((building) => {
    const home = homes.find(({ id }) => id === building.id);
    return home ? { ...building, tier: home.tier } : building;
  }) };

  const eastFacilities: [BuildingType, number, number, number][] = [
    ['library', 66, ROAD_MIDDLE, 3],
    ['hospital', 69, ROAD_MIDDLE, 3],
    ['communityHall', 72, ROAD_MIDDLE, 3],
    ['school', 74, ROAD_MIDDLE, 5],
    ['middleSchool', 66, ROAD_SOUTH, 4],
    ['policeStation', 69, ROAD_SOUTH, 4],
    ['fireStation', 72, ROAD_SOUTH, 4],
    ['townHall', 75, ROAD_SOUTH, 1],
    ['middleSchool', 52, ROAD_NORTH, 4],
  ];
  for (const [type, x, roadY, tier] of eastFacilities) placeFacingSouthRoad(type, x, roadY, tier);
  const westFacilities: [BuildingType, number, number][] = [['school', 50, 4], ['hospital', 52, 3], ['library', 55, 3], ['communityHall', 58, 3], ['communityHall', 59, 3]];
  for (const [type, x, tier] of westFacilities) place(type, x, ROAD_SOUTH + 1, tier);
  place('recyclingPlant', 60, ROAD_SOUTH + 1, 4);

  place('bakery', 66, ROAD_MIDDLE + 1);
  place('supermarket', 69, ROAD_MIDDLE + 1);
  place('shop', 72, ROAD_MIDDLE + 1, 2);
  place('shop', 73, ROAD_MIDDLE + 1, 2);
  place('office', 75, ROAD_MIDDLE + 1, 2);

  placeFacingSouthRoad('theater', 59, ROAD_SOUTH, 3);
  for (const x of [51, 54, 57, 60]) place('park', x, 59, 5);
  for (const x of [51, 54]) place('park', x, 65, 5);
  for (let x = 50; x <= 62; x++) placeFacingSouthRoad('shop', x, ROAD_MIDDLE, 4);
  for (const x of [52, 55, 58, 61]) run({ type: 'PlaceCrossing', x, y: ROAD_MIDDLE });
  for (let x = 50; x <= 57; x++) place('tree', x, 67, 3);
  for (const x of [57, 62]) place('tree', x, 65, 3);
  for (const x of [55, 58]) placeFacingSouthRoad('office', x, ROAD_NORTH, 3);
  for (const x of [54, 57, 68, 69, 70, 71, 72, 73, 74, 75]) placeFacingSouthRoad('shop', x, ROAD_NORTH, 4);
  for (const [type, x] of [['synagogue', 60], ['mosque', 62], ['catholicChurch', 66], ['buddhistTemple', 76]] as const) placeFacingSouthRoad(type, x, ROAD_NORTH, 3);
  for (const x of [55, 58, 61, 66, 69, 72, 75]) place('park', x, 52, 5);
  for (let x = 50; x <= 77; x++) place('tree', x, 51, 3);
  for (const x of [53, 56, 59, 62, 67, 70, 73, 76]) run({ type: 'PlaceCrossing', x, y: ROAD_NORTH });
  for (let x = 65; x <= 77; x++) place('tree', x, 65, 3);
  for (let x = 66; x <= 73; x++) place('appleTree', x, 49);
  place('theater', 66, ROAD_SOUTH + 1, 3);
  for (const x of [66, 69, 72]) place('solar', x, ROAD_SOUTH + 5);
  place('battery', 75, ROAD_SOUTH + 5);

  for (let tier = 2; tier <= 3; tier++) run({ type: 'UpgradeRoads', tiles: state.roads.map(({ x, y }) => ({ x, y })) });

  place('geothermalPlant', 57, 73, 6);
  for (const id of windTurbines.slice(2)) run({ type: 'SellBuilding', id });

  for (const { id } of homes) {
    run({ type: 'EquipHome', buildingId: id, equipment: 'insulation' });
    run({ type: 'EquipSolarPanels', buildingId: id });
  }

  state = { ...state, urbs: 48_250, storage: goodsOf(20), marketUnlocked: true, tutorial: null, lastSeen: NOW };
  return state;
}
