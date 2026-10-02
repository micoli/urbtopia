import { BuildMenuContent } from './BuildMenuContent';
import { MarketContent } from './MarketContent';
import { MenuContent } from './MenuContent';
import { SelectionContent } from './SelectionContent';
import { useUi } from './hooks';
import { useSelectedBuilding } from './useSelectedBuilding';

export type SheetKind = 'selection' | 'market' | 'menu' | 'build' | null;

export function useSheetKind(): SheetKind {
  const building = useSelectedBuilding();
  const marketOpen = useUi((store) => store.marketOpen);
  const menuOpen = useUi((store) => store.menuOpen);
  const flyout = useUi((store) => store.flyout);
  if (building) return 'selection';
  if (marketOpen) return 'market';
  if (menuOpen) return 'menu';
  return flyout ? 'build' : null;
}

export function SheetContent() {
  const kind = useSheetKind();
  if (kind === 'selection') return <SelectionContent />;
  if (kind === 'market') return <MarketContent />;
  if (kind === 'menu') return <MenuContent />;
  if (kind === 'build') return <BuildMenuContent />;
  return null;
}
