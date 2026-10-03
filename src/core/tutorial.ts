import { citizensOf } from './city';
import type { Command } from './commands';
import { SHOP, TAX } from './economy';
import type { Building, BuildingType, GameState } from './state';

export const TUTORIAL_STEPS = [
  'road',
  'workshop',
  'factory',
  'storehouse',
  'wood',
  'planks',
  'shop',
  'stock',
  'sell',
  'utilities',
  'home',
  'tax',
] as const;

export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

const WOOD_GOAL = 12;
const PLANKS_GOAL = SHOP.stackSize;

const hasBuilding = (state: GameState, type: BuildingType) => state.buildings.some((building) => building.type === type);

const homeOf = (state: GameState): Building | undefined => state.buildings.find((building) => building.type === 'home');

const BUILDING_STEPS: Partial<Record<TutorialStep, BuildingType[]>> = {
  workshop: ['workshop'],
  factory: ['factory'],
  storehouse: ['storehouse'],
  shop: ['shop'],
  utilities: ['powerPlant', 'waterTower'],
  home: ['home'],
};

const PRODUCTION_STEPS: Partial<Record<TutorialStep, { building: BuildingType; item: string }>> = {
  wood: { building: 'workshop', item: 'wood' },
  planks: { building: 'factory', item: 'planks' },
};

function isStepDone(state: GameState, step: TutorialStep): boolean {
  const buildingTypes = BUILDING_STEPS[step];
  if (buildingTypes) return buildingTypes.every((type) => hasBuilding(state, type));
  switch (step) {
    case 'road':
      return state.roads.length > 0;
    case 'wood':
      return (state.storage.materials.wood ?? 0) >= WOOD_GOAL;
    case 'planks':
      return (state.storage.goods.planks ?? 0) >= PLANKS_GOAL;
    case 'stock':
      return state.buildings.some((building) => building.stacks.some((stack) => stack.good !== null));
    case 'sell':
      return state.buildings.some((building) => building.stacks.some((stack) => stack.good !== null && stack.stock < SHOP.stackSize));
    case 'tax': {
      const home = homeOf(state);
      return home !== undefined && home.taxCitizenMs >= TAX.hourMs;
    }
    default:
      return false;
  }
}

export function progressTutorial(state: GameState): GameState {
  let index = state.tutorial === null ? -1 : TUTORIAL_STEPS.indexOf(state.tutorial);
  if (index === -1) return state;
  while (index < TUTORIAL_STEPS.length && isStepDone(state, TUTORIAL_STEPS[index] as TutorialStep)) index++;
  const step = TUTORIAL_STEPS[index] ?? null;
  return step === state.tutorial ? state : { ...state, tutorial: step };
}

const ALWAYS_ALLOWED: Command['type'][] = ['BuildRoad', 'MoveBuilding', 'SkipTime', 'SkipTutorialStep', 'SkipTutorial'];

export function tutorialAllows(state: GameState, command: Command): boolean {
  const step = state.tutorial;
  if (step === null || ALWAYS_ALLOWED.includes(command.type)) return true;
  if (command.type === 'PlaceBuilding') return BUILDING_STEPS[step]?.includes(command.buildingType) ?? false;
  if (command.type === 'QueueProduction') {
    const production = PRODUCTION_STEPS[step];
    const building = state.buildings.find((candidate) => candidate.id === command.buildingId);
    return production !== undefined && building?.type === production.building && command.item === production.item;
  }
  if (command.type === 'StockShop') return step === 'stock';
  if (command.type === 'Collect') return step === 'wood' || step === 'planks' || step === 'sell' || step === 'tax';
  return false;
}

function remainingProductionMs(state: GameState, now: number): number | null {
  const remaining = state.buildings.map((building) => {
    const pending = building.queue.filter((entry) => !entry.done);
    const running = pending[0];
    if (!running || running.startedAt === null) return 0;
    const elapsed = now - running.startedAt;
    return pending.reduce((total, entry) => total + entry.duration, 0) - elapsed;
  });
  const longest = Math.max(0, ...remaining);
  return longest > 0 ? longest : null;
}

function nextSaleMs(state: GameState, now: number): number | null {
  const waits = state.buildings.flatMap((building) =>
    building.stacks.filter((stack) => stack.stock > 0 && stack.nextSaleAt !== null).map((stack) => (stack.nextSaleAt as number) - now),
  );
  return waits.length === 0 ? null : Math.max(0, Math.min(...waits));
}

function nextTaxMs(state: GameState): number | null {
  const home = homeOf(state);
  if (!home) return null;
  const citizens = citizensOf(home.tier);
  const missing = TAX.hourMs - home.taxCitizenMs;
  return citizens === 0 || missing <= 0 ? null : Math.ceil(missing / citizens);
}

export function tutorialSkipMs(state: GameState, now: number): number | null {
  switch (state.tutorial) {
    case 'wood':
    case 'planks':
      return remainingProductionMs(state, now);
    case 'sell':
      return nextSaleMs(state, now);
    case 'tax':
      return nextTaxMs(state);
    default:
      return null;
  }
}
