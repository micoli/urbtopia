export const NEED_FACTOR_IDS = [
  'electricity', 'water', 'food',
  'safety', 'health', 'pollution', 'congestion', 'climate',
  'culture', 'leisure', 'walking', 'solidarity',
  'education', 'administration', 'shops',
  'worship', 'greenSpaces', 'biodiversity',
] as const;

export type NeedFactorId = (typeof NEED_FACTOR_IDS)[number];

export const SANCTIONABLE_FACTOR_IDS = ['electricity', 'water', 'safety', 'health', 'pollution', 'congestion', 'climate'] as const satisfies readonly NeedFactorId[];

export type SanctionableFactorId = (typeof SANCTIONABLE_FACTOR_IDS)[number];
