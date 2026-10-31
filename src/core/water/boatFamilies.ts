export const BOAT_FAMILIES = ['pleasure', 'fishing', 'casino', 'pirate'] as const

export const MARINA_BOAT_FAMILIES = ['pleasure', 'fishing', 'casino'] as const;

export type BoatFamilyName = (typeof BOAT_FAMILIES)[number];
