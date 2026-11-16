import factoryBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };
import homeBalance from '../../../assets/defs/balance/homeInterior.json' with { type: 'json' };
import packhouseBalance from '../../../assets/defs/balance/packhouseInterior.json' with { type: 'json' };
import { isHomeType } from '../buildings/buildingDefinitions';
import type { BuildingType } from '../engine/state';
import { interiorDeclarationOf, type InteriorBonusModel, type InteriorFamily } from './interiorStaff';
import { valueByTier } from './valueByTier';

// The most speed and yield a floor can approach at a Tier, and what the Exits of a Line add to the sales and to the room when the type has them. A type with no bonus has no cap.
export interface InteriorProfileCaps {
  speed: number;
  yield: number;
  sales?: number;
  capacity?: number;
}

export interface InteriorProfile {
  readonly family: InteriorFamily;
  readonly bonusModel?: InteriorBonusModel;
  readonly line: boolean;
  gridSize(tier: number): number;
  caps(tier: number): InteriorProfileCaps;
  technicianPosts(tier: number): number;
}

interface ProfileNumbers {
  gridSizes: readonly number[];
  speedCaps?: readonly number[];
  yieldCaps?: readonly number[];
  salesCaps?: readonly number[];
  capacityCaps?: readonly number[];
  technicianPosts?: readonly number[];
}

// A Packhouse, and the interiors that run a Line of crates, with or without assigned Staff.
const LINE_MODELS: readonly (InteriorBonusModel | undefined)[] = ['packhouse', 'line', 'assigned'];

const profileOf = (family: InteriorFamily, numbers: ProfileNumbers, bonusModel?: InteriorBonusModel): InteriorProfile => ({
  family,
  bonusModel,
  line: LINE_MODELS.includes(bonusModel),
  gridSize: tier => valueByTier(numbers.gridSizes, tier),
  caps: tier => ({
    speed: valueByTier(numbers.speedCaps ?? [], tier),
    yield: valueByTier(numbers.yieldCaps ?? [], tier),
    ...(numbers.salesCaps ? { sales: valueByTier(numbers.salesCaps, tier) } : {}),
    ...(numbers.capacityCaps ? { capacity: valueByTier(numbers.capacityCaps, tier) } : {}),
  }),
  technicianPosts: tier => valueByTier(numbers.technicianPosts ?? [], tier),
});

// Every Home is a type of building of the same kind, so its interior is declared once, by kind, in its own balance file.
const HOME_PROFILE = profileOf('home', { gridSizes: homeBalance.gridSizes });

export const interiorProfileOf = (type: BuildingType): InteriorProfile | undefined => {
  if (isHomeType(type)) return HOME_PROFILE;
  const declaration = interiorDeclarationOf(type);
  if (!declaration) return undefined;
  const { family, bonusModel, layout, service } = declaration;
  if (bonusModel === 'factory') return profileOf(family, factoryBalance, bonusModel);
  if (bonusModel === 'packhouse') return profileOf(family, packhouseBalance, bonusModel);
  return profileOf(family, { gridSizes: layout?.gridSizes ?? service?.gridSizes ?? [], ...layout }, bonusModel);
};
