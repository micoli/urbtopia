import { interiorBenefitsOf, interiorLinksOf } from '../factory/factoryInterior';
import { FIXTURES } from '../venues/fixtures';
import { hasStock } from '../venues/supermarket';
import { hiredOf } from '../venues/staff';
import { totalInteriorStaff } from '../interiors/interiorStaff';
import type { Building, GameState } from '../engine/state';

export const VENUE_TUTORIAL_STEPS = {
  arcade: ['place', 'fixture', 'employee', 'collect'],
  supermarket: ['place', 'checkout', 'shelf', 'stock', 'cashier', 'collect'],
  factory: ['motor', 'drive', 'flow', 'cooling'],
  mill: ['motor', 'drive', 'miller'],
  school: ['furniture', 'teacher'],
} as const;

export type VenueTutorialType = keyof typeof VENUE_TUTORIAL_STEPS;

export type VenueTutorialStep = (typeof VENUE_TUTORIAL_STEPS)[VenueTutorialType][number];

export const VENUE_TUTORIAL_TYPES = Object.keys(VENUE_TUTORIAL_STEPS) as VenueTutorialType[];

export const hasVenueTutorial = (type: string): type is VenueTutorialType => Object.hasOwn(VENUE_TUTORIAL_STEPS, type);

export const stepsOfVenueTutorial = (type: VenueTutorialType): readonly VenueTutorialStep[] => VENUE_TUTORIAL_STEPS[type];

export const isVenueTutorialStep = (type: string, step: unknown): boolean =>
  hasVenueTutorial(type) && (stepsOfVenueTutorial(type) as readonly unknown[]).includes(step);

// The Buildings a tutorial follows: the Venues of its type, or the Factories, Mills and Schools whose interior has been used.
const sitesOf = (state: GameState, type: VenueTutorialType): Building[] =>
  state.buildings.filter(building => building.type === type && (type === 'factory' || type === 'mill' || type === 'school' ? building.interior !== undefined : building.venue !== undefined));

function isDoneInInterior(building: Building, step: VenueTutorialStep): boolean {
  const fixtures = building.interior?.fixtures ?? [];
  const linked = interiorLinksOf(fixtures).linked;
  const linkedMachines = fixtures.filter(fixture => linked.has(fixture.id));
  switch (step) {
    case 'motor':
      return fixtures.some(fixture => FIXTURES[fixture.type].role === 'motor');
    case 'drive':
      return linkedMachines.some(fixture => FIXTURES[fixture.type].drive !== undefined);
    case 'flow':
      return linkedMachines.some(fixture => FIXTURES[fixture.type].flow !== undefined);
    case 'miller':
      return totalInteriorStaff(building) > 0;
    case 'cooling':
      return fixtures.some(fixture => FIXTURES[fixture.type].role === 'motor' && interiorBenefitsOf(fixtures, fixture).cooling > 0);
    default:
      return false;
  }
}

const isDoneIn = (building: Building, step: VenueTutorialStep): boolean => {
  if (building.type === 'factory' || building.type === 'mill') return isDoneInInterior(building, step);
  if (building.type === 'school') return step === 'furniture' ? (building.interior?.fixtures.length ?? 0) > 0 : step === 'teacher' && totalInteriorStaff(building) > 0;
  const venue = building.venue!;
  switch (step) {
    case 'place':
      return true;
    case 'fixture':
      return venue.fixtures.length > 0;
    case 'checkout':
      return venue.fixtures.some((fixture) => FIXTURES[fixture.type].checkout !== undefined);
    case 'shelf':
      return venue.fixtures.some((fixture) => FIXTURES[fixture.type].shelf !== undefined);
    case 'stock':
      return venue.fixtures.some(hasStock);
    case 'employee':
      return hiredOf(venue, 'employee') > 0;
    case 'cashier':
      return hiredOf(venue, 'cashier') > 0;
    case 'collect':
      return (venue.collected ?? 0) > 0;
    default:
      return false;
  }
};

export const isVenueStepDone = (state: GameState, type: VenueTutorialType, step: VenueTutorialStep): boolean =>
  sitesOf(state, type).some(building => isDoneIn(building, step));

function firstStepNotDone(state: GameState, type: VenueTutorialType, from: number): VenueTutorialStep | null {
  const steps = stepsOfVenueTutorial(type);
  let index = from;
  while (index < steps.length && isVenueStepDone(state, type, steps[index] as VenueTutorialStep)) index++;
  return steps[index] ?? null;
}

function progressOne(state: GameState, type: VenueTutorialType): GameState {
  const current = state.venueTutorials?.[type];
  if (current === null) return state;
  if (current === undefined) {
    if (state.tutorial !== null || sitesOf(state, type).length === 0) return state;
    return withEntry(state, type, firstStepNotDone(state, type, 0));
  }
  const next = firstStepNotDone(state, type, stepsOfVenueTutorial(type).indexOf(current));
  return next === current ? state : withEntry(state, type, next);
}

const withEntry = (state: GameState, type: VenueTutorialType, step: VenueTutorialStep | null): GameState => ({
  ...state,
  venueTutorials: { ...state.venueTutorials, [type]: step },
});

export const progressVenueTutorials = (state: GameState): GameState => VENUE_TUTORIAL_TYPES.reduce(progressOne, state);

export function skipVenueTutorial(state: GameState, type: VenueTutorialType): GameState {
  if (state.venueTutorials?.[type] === undefined || state.venueTutorials[type] === null) return state;
  return withEntry(state, type, null);
}

export function replayVenueTutorial(state: GameState, type: VenueTutorialType): GameState {
  if (sitesOf(state, type).length === 0) return state;
  const step = firstStepNotDone(state, type, 0);
  return step === null ? state : withEntry(state, type, step);
}

export const canReplayVenueTutorial = (state: GameState, type: VenueTutorialType): boolean =>
  sitesOf(state, type).length > 0 && firstStepNotDone(state, type, 0) !== null;
