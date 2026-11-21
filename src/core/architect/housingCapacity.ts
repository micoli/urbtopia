import { HOME_TIERS } from '../economy/economy';

// The habitable cells that one level of a Home holds: a Brownstone, 1×2 tiles of 4×4 cells, has 32 cells per floor and one level per floor.
export const CELLS_PER_HOME_LEVEL = 24;

export const homeLevelOfCells = (cells: number): number => Math.min(HOME_TIERS.length, Math.max(1, Math.ceil(cells / CELLS_PER_HOME_LEVEL)));

// The Citizens a house of this many cells lodges: the Citizens of the Home level its cells reach.
export const citizensOfCells = (cells: number): number => HOME_TIERS[homeLevelOfCells(cells) - 1]?.citizens ?? 0;
