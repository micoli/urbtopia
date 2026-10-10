import type { VenueType } from '../core';
import { definitionOf } from '../core/buildings/buildingDefinitions';
import { modelFileOf } from '../core/models/modelFiles';
import { VENUE_TYPES } from '../core/venues/profiles';

import { MINI_CHARACTER_LETTERS as LETTERS } from './miniCharacters';

export { MINI_CHARACTER_FILES } from './miniCharacters';

const miniCharacter = (gender: 'female' | 'male', letter: (typeof LETTERS)[number]): string => `mini-characters/character-${gender}-${letter}`;

// Visitors of every Venue come from the Mini Characters pack; women and men alternate so neighbours differ.
export const VENUE_CUSTOMER_MODELS: readonly string[] = LETTERS.flatMap(letter => [miniCharacter('female', letter), miniCharacter('male', letter)]);

// The staff of a Venue is the character shipped with its own pack. The Hotel is built from the furniture kit, which has none.
export const VENUE_STAFF_MODELS = Object.fromEntries(VENUE_TYPES.map(type => [type, definitionOf(type).staffModels!.map(modelFileOf)])) as unknown as Record<VenueType, readonly string[]>;

export const venueCrowdModelsOf = (venue: VenueType): readonly string[] => [...new Set([...VENUE_CUSTOMER_MODELS, ...VENUE_STAFF_MODELS[venue]])];
