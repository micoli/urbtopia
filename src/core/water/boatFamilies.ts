export const BOAT_FAMILIES = ['pleasure', 'fishing', 'casino'] as const;

export type BoatFamilyName = (typeof BOAT_FAMILIES)[number];
