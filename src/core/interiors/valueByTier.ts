// The value of a list for a Tier: the value of that Tier, the last one when the Tier goes beyond the list, and 0 for an empty list.
export const valueByTier = (values: readonly number[], tier: number): number => (values.length === 0 ? 0 : values[Math.min(tier, values.length) - 1]!);
