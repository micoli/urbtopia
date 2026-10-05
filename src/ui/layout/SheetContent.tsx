import { BuildMenuContent } from '../build/BuildMenuContent';
import { MenuContent } from '../system/MenuContent';
import { SelectionContentPanel } from '../buildings/SelectionContentPanel.tsx';
import { useUi } from '../common/hooks';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';

export type SheetKind = 'selection' | 'menu' | 'build' | null;

export function useSheetKind(): SheetKind {
  const building = useSelectedBuilding();
  const menuOpen = useUi((store) => store.menuOpen);
  const flyout = useUi((store) => store.flyout);
  if (building) return 'selection';
  if (menuOpen) return 'menu';
  return flyout ? 'build' : null;
}

export function SheetContent() {
  const kind = useSheetKind();
  if (kind === 'selection') return <SelectionContentPanel />;
  if (kind === 'menu') return <MenuContent />;
  if (kind === 'build') return <BuildMenuContent />;
  return null;
}
