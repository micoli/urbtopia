import { Suspense, lazy } from 'react';
import type { ItemId } from '../../core';
import { useIsClient } from '../common/useIsClient';

// Loaded on demand: the item icons are rendered with Three.js, which the Guide must not ship at startup.
const ItemIcon = lazy(() => import('../common/ItemIcon').then(({ ItemIcon: component }) => ({ default: component })));

export function ProductionChainItemIcon({ item }: { item: ItemId }) {
  // The prerender cannot suspend: the placeholder is all the server and the hydration see.
  if (!useIsClient()) return <span className="item-icon" />;
  return (
    <Suspense fallback={<span className="item-icon" />}>
      <ItemIcon item={item} />
    </Suspense>
  );
}
