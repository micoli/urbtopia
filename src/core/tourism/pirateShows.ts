import type { Building } from '../engine/state';
import { hashSeed, nextRandom } from '../engine/random';

export const PIRATE_SHOW_TITLES = ['krakensRevenge', 'saltGalleon', 'scarletTide', 'ghostFleet', 'goldenSkull', 'stormCaptain', 'mutinyMoon', 'lastBroadside', 'sirenReef', 'ironHook', 'rumIsland', 'cannonsAtDawn'] as const;

export type PirateShowTitle = (typeof PIRATE_SHOW_TITLES)[number];

// Drawn from the building and the number of Shows it has held, so that the dialog and the Show agree.
export function pirateShowTitleOf(building: Pick<Building, 'id' | 'attraction'>): PirateShowTitle {
  const { value } = nextRandom(hashSeed(`pirateShow:${building.id}:${building.attraction?.shows ?? 0}`));
  return PIRATE_SHOW_TITLES[Math.floor(value * PIRATE_SHOW_TITLES.length)]!;
}
