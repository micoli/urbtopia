import { citizenCount } from '../environment/ecology';
import type { BuildingType, GameState } from '../engine/state';
import { interiorUnlockCitizensOf } from './interiorStaff';

// A city fits out an interior once it has this many Citizens; a building with no threshold is open from the start.
export const isInteriorUnlocked = (state: GameState, type: BuildingType): boolean => citizenCount(state) >= interiorUnlockCitizensOf(type);
