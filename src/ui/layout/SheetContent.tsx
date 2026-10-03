import { BuildMenuContent } from '../build/BuildMenuContent';
import { MarketContent } from '../market/MarketContent';
import { MenuContent } from '../system/MenuContent';
import { SelectionContent } from '../buildings/SelectionContent';
import { useUi } from '../common/hooks';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';

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
