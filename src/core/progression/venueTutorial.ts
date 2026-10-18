import { FIXTURES } from '../venues/fixtures';
import { hasStock } from '../venues/supermarket';
import { hiredOf } from '../venues/staff';
import type { Building, GameState, VenueData } from '../engine/state';

export const VENUE_TUTORIAL_STEPS = {
  arcade: ['place', 'fixture', 'employee', 'collect'],
  supermarket: ['place', 'checkout', 'shelf', 'stock', 'cashier', 'collect'],
} as const;

export type VenueTutorialType = keyof typeof VENUE_TUTORIAL_STEPS;

export type VenueTutorialStep = (typeof VENUE_TUTORIAL_STEPS)[VenueTutorialType][number];

export const VENUE_TUTORIAL_TYPES = Object.keys(VENUE_TUTORIAL_STEPS) as VenueTutorialType[];

export const hasVenueTutorial = (type: string): type is VenueTutorialType => Object.hasOwn(VENUE_TUTORIAL_STEPS, type);

export const stepsOfVenueTutorial = (type: VenueTutorialType): readonly VenueTutorialStep[] => VENUE_TUTORIAL_STEPS[type];

export const isVenueTutorialStep = (type: string, step: unknown): boolean =>
  hasVenueTutorial(type) && (stepsOfVenueTutorial(type) as readonly unknown[]).includes(step);

const venuesOf = (state: GameState, type: VenueTutorialType): (Building & { venue: VenueData })[] =>
  state.buildings.filter((building): building is Building & { venue: VenueData } => building.type === type && building.venue !== undefined);

const isDoneIn = (venue: VenueData, step: VenueTutorialStep): boolean => {
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
  }
};

export const isVenueStepDone = (state: GameState, type: VenueTutorialType, step: VenueTutorialStep): boolean =>
  venuesOf(state, type).some(({ venue }) => isDoneIn(venue, step));

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
    if (state.tutorial !== null || venuesOf(state, type).length === 0) return state;
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
  if (venuesOf(state, type).length === 0) return state;
  const step = firstStepNotDone(state, type, 0);
  return step === null ? state : withEntry(state, type, step);
}

export const canReplayVenueTutorial = (state: GameState, type: VenueTutorialType): boolean =>
  venuesOf(state, type).length > 0 && firstStepNotDone(state, type, 0) !== null;
