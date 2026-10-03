import { taxDue, type Building } from '../core';

export function collectBadgeLabel(building: Building): string | null {
  if (building.type === 'shop') {
    const earned = building.stacks.reduce((total, stack) => total + stack.earned, 0);
    return earned > 0 ? `+${earned}` : null;
  }
  if (building.type === 'home') {
    const due = taxDue(building);
    return due > 0 ? `+${due}` : null;
  }
  const ready = building.queue.filter((entry) => entry.done).length;
  return ready > 0 ? `✓ ${ready}` : null;
}
