import factoryBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };
import homeBalance from '../../../assets/defs/balance/homeInterior.json' with { type: 'json' };
import packhouseBalance from '../../../assets/defs/balance/packhouseInterior.json' with { type: 'json' };
import { isHomeType } from '../buildings/buildingDefinitions';
import type { BuildingType } from '../engine/state';
import { interiorDeclarationOf, type InteriorFamily } from './interiorStaff';

export interface InteriorProfile {
  readonly family: InteriorFamily;
  readonly bonusModel?: 'factory' | 'packhouse';
  readonly line: boolean;
  gridSize(tier: number): number;
}

const profileWithSizes = (family: InteriorFamily, sizes: readonly number[], options: { bonusModel?: 'factory' | 'packhouse'; line?: boolean } = {}): InteriorProfile => ({
  family,
  bonusModel: options.bonusModel,
  line: options.line === true,
  gridSize: tier => sizes[Math.min(tier, sizes.length) - 1]!,
});

// Every Home is a type of building of the same kind, so its interior is declared once, by kind, in its own balance file.
const HOME_PROFILE = profileWithSizes('home', homeBalance.gridSizes);

export const interiorProfileOf = (type: BuildingType): InteriorProfile | undefined => {
  if (isHomeType(type)) return HOME_PROFILE;
  const declaration = interiorDeclarationOf(type);
  if (!declaration) return undefined;
  if (declaration.bonusModel === 'factory') return profileWithSizes(declaration.family, factoryBalance.gridSizes, { bonusModel: 'factory' });
  if (declaration.bonusModel === 'packhouse') return profileWithSizes(declaration.family, packhouseBalance.gridSizes, { bonusModel: 'packhouse', line: true });
  return profileWithSizes(declaration.family, declaration.layout?.gridSizes ?? declaration.service?.gridSizes ?? [], { line: declaration.layout?.line === true });
};
