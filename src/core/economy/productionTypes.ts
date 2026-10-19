import { BUILDING_ENTRIES } from '../buildings/buildingDefinitions';
import type { ProductionType } from '../buildings/buildingTypes.generated';

export const PRODUCTION_TYPES: readonly ProductionType[] = BUILDING_ENTRIES.filter(({ kind }) => kind === 'production').map(({ id }) => id as ProductionType);

export const isProductionType = (type: string): type is ProductionType => (PRODUCTION_TYPES as readonly string[]).includes(type);

interface ProductionRules {
  // Economic activity carried per Tier. The Packhouse carries none: it employs nobody and draws no economic power.
  weight: number;
  // Emissions per Tier.
  emissions: number;
  // The storage compartment its Slots count towards.
  produces: 'materials' | 'goods';
  // A Mill or a Bakery consumes as many recipes as its yield per cycle.
  scalesRecipeWithYield: boolean;
}

const RULES: Record<ProductionType, ProductionRules> = {
  workshop: { weight: 1, emissions: 0.5, produces: 'materials', scalesRecipeWithYield: false },
  mill: { weight: 1, emissions: 0.5, produces: 'materials', scalesRecipeWithYield: true },
  factory: { weight: 2, emissions: 2, produces: 'goods', scalesRecipeWithYield: false },
  bakery: { weight: 2, emissions: 2, produces: 'goods', scalesRecipeWithYield: true },
  packhouse: { weight: 0, emissions: 0, produces: 'goods', scalesRecipeWithYield: false },
};

export const industryWeightOf = (type: string): number => (isProductionType(type) ? RULES[type].weight : 0);

export const industryEmissionsOf = (type: string): number => (isProductionType(type) ? RULES[type].emissions : 0);

export const compartmentProducedBy = (type: ProductionType): 'materials' | 'goods' => RULES[type].produces;

export const scalesRecipeWithYield = (type: string): boolean => isProductionType(type) && RULES[type].scalesRecipeWithYield;

export const INDUSTRY_TYPES: readonly ProductionType[] = PRODUCTION_TYPES.filter((type) => RULES[type].weight > 0);

export const isIndustryType = (type: string): type is ProductionType => industryWeightOf(type) > 0;
