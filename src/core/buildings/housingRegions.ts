// The regions of the world a Home Architecture style comes from; the Housing section of the build menu groups the styles by region.
export const HOUSING_REGIONS = ['europe', 'mediterranean', 'asia', 'africa', 'oceania', 'americas'] as const;

export type HousingRegion = typeof HOUSING_REGIONS[number];
