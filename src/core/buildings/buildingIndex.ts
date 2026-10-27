import type { Building } from '../engine/state';

const NONE: readonly Building[] = [];
const byTypeCache = new WeakMap<readonly Building[], ReadonlyMap<string, readonly Building[]>>();

// Each tick replaces the buildings array, so per-Home lookups go through this index, built once per array, instead of scanning every building.
export function buildingsOfType(buildings: readonly Building[], type: string): readonly Building[] {
  let byType = byTypeCache.get(buildings);
  if (!byType) {
    const index = new Map<string, Building[]>();
    for (const building of buildings) {
      const group = index.get(building.type);
      if (group) group.push(building);
      else index.set(building.type, [building]);
    }
    byType = index;
    byTypeCache.set(buildings, byType);
  }
  return byType.get(type) ?? NONE;
}

const layoutCache = new WeakMap<readonly Building[], object>();
let lastLayout: { buildings: readonly Building[]; token: object } | null = null;

const sameLayout = (a: readonly Building[], b: readonly Building[]): boolean =>
  a.length === b.length && a.every((building, index) => {
    const other = b[index]!;
    return building.id === other.id && building.type === other.type && building.x === other.x && building.y === other.y && building.rotation === other.rotation && building.tier === other.tier;
  });

// A token that stays the same while no building is added, removed, moved, turned or upgraded, to key caches that only depend on where buildings stand.
export function layoutOf(buildings: readonly Building[]): object {
  const cached = layoutCache.get(buildings);
  if (cached) return cached;
  const token = lastLayout && sameLayout(lastLayout.buildings, buildings) ? lastLayout.token : {};
  layoutCache.set(buildings, token);
  lastLayout = { buildings, token };
  return token;
}
