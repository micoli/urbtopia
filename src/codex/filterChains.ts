import type { BuildingType, ItemId } from '../core';
import type { ChainItem, ChainRoot, ChainStep } from './productionChains';

export interface ChainFilter {
  matchesItem: (item: ItemId) => boolean;
  matchesBuilding: (building: BuildingType) => boolean;
  keepItem: (item: ItemId) => boolean;
  searching: boolean;
}

function dropItem(chain: ChainItem, keepItem: ChainFilter['keepItem']): ChainItem | null {
  if (!keepItem(chain.item)) return null;
  const steps = chain.steps.flatMap((step): ChainStep[] => {
    const outputs = step.outputs.flatMap((output) => dropItem(output, keepItem) ?? []);
    return outputs.length > 0 ? [{ ...step, outputs }] : [];
  });
  return { ...chain, steps };
}

// A match is shown whole, below it, and with the way that leads to it from its producer.
function narrowItem(chain: ChainItem, filter: ChainFilter): ChainItem | null {
  if (filter.matchesItem(chain.item)) return chain;
  const steps = chain.steps.flatMap((step): ChainStep[] => {
    if (filter.matchesBuilding(step.building)) return [step];
    const outputs = step.outputs.flatMap((output) => narrowItem(output, filter) ?? []);
    return outputs.length > 0 ? [{ ...step, outputs }] : [];
  });
  return steps.length > 0 ? { ...chain, steps } : null;
}

export function filterChains(roots: readonly ChainRoot[], filter: ChainFilter): ChainRoot[] {
  return roots.flatMap((root): ChainRoot[] => {
    const kept = root.items.flatMap((item) => dropItem(item, filter.keepItem) ?? []);
    const items = filter.searching && !filter.matchesBuilding(root.building) ? kept.flatMap((item) => narrowItem(item, filter) ?? []) : kept;
    return items.length > 0 ? [{ ...root, items }] : [];
  });
}
