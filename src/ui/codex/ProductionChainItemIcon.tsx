import { Suspense, lazy } from 'react';
import type { ItemId } from '../../core';

// Loaded on demand: the item icons are rendered with Three.js, which the Guide must not ship at startup.
const ItemIcon = lazy(() => import('../common/ItemIcon').then(({ ItemIcon: component }) => ({ default: component })));

export function ProductionChainItemIcon({ item }: { item: ItemId }) {
  return (
    <Suspense fallback={<span className="item-icon" />}>
      <ItemIcon item={item} />
    </Suspense>
  );
}
