export const HEX_CATEGORIES = ['habitat', 'park', 'commerce', 'industry', 'service', 'water'] as const;

export type HexCategory = (typeof HEX_CATEGORIES)[number];
