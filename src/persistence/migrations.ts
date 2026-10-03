export type MigrationStep = (state: unknown) => unknown;

function toPerBuildingTier(state: unknown): unknown {
  const { storehouseLevel, buildings, ...rest } = state as { storehouseLevel: number; buildings: { type: string; tier: number }[] };
  return {
    ...rest,
    buildings: buildings.map((building) => {
      if (building.type === 'home') return building;
      return { ...building, tier: building.type === 'storehouse' ? storehouseLevel + 1 : 1 };
    }),
  };
}

function addQueueQuantity(state: unknown): unknown {
  const { buildings, ...rest } = state as { buildings: { queue: object[] }[] };
  return { ...rest, buildings: buildings.map((building) => ({ ...building, queue: building.queue.map((entry) => ({ ...entry, quantity: 1 })) })) };
}

function addEcology(state: unknown): unknown {
  const value = state as { lastSeen: number; buildings: { type: string; tier: number }[] };
  return { ...value, busLines: [], adaptationUntil: value.lastSeen + 24 * 3_600_000,
    buildings: value.buildings.map(b => b.type === 'home' && b.tier === 4 ? { ...b, solar: true } : b) };
}

export const MIGRATIONS: Record<number, MigrationStep> = { 1: toPerBuildingTier, 2: addQueueQuantity, 3: addEcology, 4: state => ({ ...(state as object), brtRoads: [], rails: [], transitLines: [], transitFleet: [] }), 5: state => state, 6: state => state };

export function migrate(state: unknown, fromVersion: number, toVersion: number, steps: Record<number, MigrationStep> = MIGRATIONS): unknown {
  let current = state;
  for (let version = fromVersion; version < toVersion; version++) {
    const step = steps[version];
    if (!step) throw new Error(`Missing migration from version ${version}`);
    current = step(current);
  }
  return current;
}
