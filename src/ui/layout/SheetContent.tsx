import { BuildMenuContent } from '../build/BuildMenuContent';
import { SettingsContent } from '../system/SettingsContent';
import { SelectionContentPanel } from '../buildings/SelectionContentPanel.tsx';
import { useUi } from '../common/hooks';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';

export type SheetKind = 'selection' | 'settings' | 'build' | null;

export function useSheetKind(): SheetKind {
  const building = useSelectedBuilding();
  const settingsOpen = useUi((store) => store.settingsOpen);
  const flyout = useUi((store) => store.flyout);
  if (building) return 'selection';
  if (settingsOpen) return 'settings';
  return flyout ? 'build' : null;
}

export function SheetContent() {
  const kind = useSheetKind();
  if (kind === 'selection') return <SelectionContentPanel />;
  if (kind === 'settings') return <SettingsContent />;
  if (kind === 'build') return <BuildMenuContent />;
  return null;
}
