import { BuildMenuContent } from '../build/BuildMenuContent';
import { SelectionContentPanel } from '../buildings/SelectionContentPanel.tsx';
import { useUi } from '../common/hooks';
import { SelectionMiniBar } from './SelectionMiniBar';
import { useSelectionExpansion } from './useSelectionExpansion';

export type SheetKind = 'selection' | 'build' | null;

export function useSheetKind(): SheetKind {
  const { hasSelection } = useSelectionExpansion();
  const flyout = useUi((store) => store.flyout);
  if (hasSelection) return 'selection';
  return flyout ? 'build' : null;
}

export function SheetContent() {
  const kind = useSheetKind();
  const { expanded, expand } = useSelectionExpansion();
  if (kind === 'selection') return expanded ? <SelectionContentPanel /> : <SelectionMiniBar onExpand={expand} />;
  if (kind === 'build') return <BuildMenuContent />;
  return null;
}
