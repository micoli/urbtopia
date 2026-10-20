export const FACTION_IDS = ['economy', 'environment', 'services'] as const;

export type FactionId = (typeof FACTION_IDS)[number];
