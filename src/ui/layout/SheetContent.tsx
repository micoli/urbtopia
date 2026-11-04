import { BuildMenuContent } from '../build/BuildMenuContent';
import { SelectionContentPanel } from '../buildings/SelectionContentPanel.tsx';
import { useUi } from '../common/hooks';
import { useSelectedAccess } from '../buildings/useSelectedAccess';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';

export type SheetKind = 'selection' | 'build' | null;

export function useSheetKind(): SheetKind {
  const building = useSelectedBuilding();
  const access = useSelectedAccess();
  const flyout = useUi((store) => store.flyout);
  if (building || access) return 'selection';
  return flyout ? 'build' : null;
}

export function SheetContent() {
  const kind = useSheetKind();
  if (kind === 'selection') return <SelectionContentPanel />;
  if (kind === 'build') return <BuildMenuContent />;
  return null;
}
