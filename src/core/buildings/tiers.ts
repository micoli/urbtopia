// What a Tier leaves out it keeps from the previous one, except its upgrade cost.
const NOT_INHERITED = new Set(['upgradeCost']);

export function resolveTiers<T extends object>(tiers: readonly Partial<T>[]): T[] {
  const resolved: T[] = [];
  for (const tier of tiers) {
    const previous = Object.fromEntries(Object.entries(resolved.at(-1) ?? {}).filter(([key]) => !NOT_INHERITED.has(key)));
    resolved.push({ ...previous, ...tier } as T);
  }
  return resolved;
}

// A variant overrides the first Tiers of the base, inheriting among its own Tiers; later Tiers keep the base.
export function resolveVariant<T extends object>(base: readonly T[], variant: readonly Partial<T>[]): T[] {
  const overrides = resolveTiers<Partial<T>>(variant);
  return base.map((tier, index) => (index < overrides.length ? { ...tier, ...overrides[index] } : tier));
}
