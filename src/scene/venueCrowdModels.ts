import type { VenueType } from '../core';

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

export const MINI_CHARACTER_FILES: readonly string[] = (['female', 'male'] as const).flatMap(gender => LETTERS.map(letter => `character-${gender}-${letter}`));

const miniCharacter = (gender: 'female' | 'male', letter: (typeof LETTERS)[number]): string => `mini-characters/character-${gender}-${letter}`;

// Visitors of every Venue come from the Mini Characters pack; women and men alternate so neighbours differ.
export const VENUE_CUSTOMER_MODELS: readonly string[] = LETTERS.flatMap(letter => [miniCharacter('female', letter), miniCharacter('male', letter)]);

// The staff of a Venue is the character shipped with its own pack. The Hotel is built from the furniture kit, which has none.
export const VENUE_STAFF_MODELS: Record<VenueType, readonly string[]> = {
  arcade: ['mini-arcade/character-employee'],
  supermarket: ['mini-market/character-employee'],
  hotel: [miniCharacter('female', 'a'), miniCharacter('male', 'a'), miniCharacter('female', 'd'), miniCharacter('male', 'd')],
};

export const venueCrowdModelsOf = (venue: VenueType): readonly string[] => [...new Set([...VENUE_CUSTOMER_MODELS, ...VENUE_STAFF_MODELS[venue]])];
