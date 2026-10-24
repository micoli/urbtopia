import { citizensOf, createBuilding, maxTierOf, newGame, type Building, type GameState } from '../../core';
import type { ReaderSettings } from './readerSettings';

// A fixed clock keeps the prerendered page and the hydrated one identical.
const GUIDE_CLOCK = Date.UTC(2026, 0, 1);

const HOME_TIERS = Array.from({ length: maxTierOf('home') }, (_, index) => index + 1).reverse();

function homesFor(citizens: number, firstId: number): Building[] {
  const homes: Building[] = [];
  let missing = citizens;
  while (missing > 0) {
    const tier = HOME_TIERS.find(candidate => citizensOf(candidate) <= missing) ?? HOME_TIERS.at(-1)!;
    homes.push({ ...createBuilding(firstId + homes.length, 'home', homes.length * 2, 0, 0), tier });
    missing -= citizensOf(tier);
  }
  return homes;
}

export function readerStateOf({ difficulty, citizens }: ReaderSettings): GameState {
  const state = newGame({ seed: 'guide', now: GUIDE_CLOCK, difficulty, tutorial: false });
  const homes = homesFor(citizens, state.nextId);
  return { ...state, adaptationUntil: GUIDE_CLOCK, buildings: [...state.buildings, ...homes], nextId: state.nextId + homes.length };
}
