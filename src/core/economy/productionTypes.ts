import { BUILDING_ENTRIES } from '../buildings/buildingDefinitions';
import type { ProductionType } from '../buildings/buildingTypes.generated';

export const PRODUCTION_TYPES: readonly ProductionType[] = BUILDING_ENTRIES.filter(({ kind }) => kind === 'production').map(({ id }) => id as ProductionType);

export const isProductionType = (type: string): type is ProductionType => (PRODUCTION_TYPES as readonly string[]).includes(type);

// How much economic activity a production building carries per Tier. The Packhouse carries none: it employs nobody and draws no economic power.
const INDUSTRY_WEIGHT: Record<ProductionType, number> = { workshop: 1, mill: 1, factory: 2, bakery: 2, packhouse: 0 };

export const industryWeightOf = (type: string): number => (isProductionType(type) ? INDUSTRY_WEIGHT[type] : 0);

export const INDUSTRY_TYPES: readonly ProductionType[] = PRODUCTION_TYPES.filter((type) => INDUSTRY_WEIGHT[type] > 0);

export const isIndustryType = (type: string): type is ProductionType => industryWeightOf(type) > 0;
