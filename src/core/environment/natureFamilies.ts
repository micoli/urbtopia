export const NATURE_FAMILIES = {
  tree: { cost: 60, unlock: 6, radius: 5, cooling: 3, biodiversity: 2, wellbeing: 2, size: 1 },
  grass: { cost: 20, unlock: 6, radius: 3, cooling: 1, biodiversity: 1, wellbeing: 1, size: 1 },
  shrub: { cost: 35, unlock: 15, radius: 4, cooling: 1, biodiversity: 2, wellbeing: 1.5, size: 1 },
  flower: { cost: 30, unlock: 15, radius: 4, cooling: 0.5, biodiversity: 3, wellbeing: 2, size: 1 },
  habitat: { cost: 25, unlock: 15, radius: 4, cooling: 0, biodiversity: 2, wellbeing: 0, size: 1 },
  conifer: { cost: 90, unlock: 32, radius: 6, cooling: 4, biodiversity: 3, wellbeing: 3, size: 1 },
  decoration: { cost: 50, unlock: 15, radius: 4, cooling: 0, biodiversity: 0, wellbeing: 1.5, size: 1 },
  palm: { cost: 100, unlock: 60, radius: 6, cooling: 3, biodiversity: 3, wellbeing: 3, size: 1 },
} as const;

export type NatureFamily = keyof typeof NATURE_FAMILIES;
