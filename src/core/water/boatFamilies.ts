export const BOAT_FAMILIES = ['pleasure', 'fishing', 'casino', 'pirate', 'frigate'] as const;

export const MARINA_BOAT_FAMILIES = ['pleasure', 'fishing', 'casino'] as const;

// The Boats that perform in the Shows of a Pirate cove.
export const COVE_BOAT_FAMILIES = ['pirate', 'frigate'] as const;

export type BoatFamilyName = (typeof BOAT_FAMILIES)[number];

export const isCoveBoatFamily = (family: string): boolean => (COVE_BOAT_FAMILIES as readonly string[]).includes(family);
