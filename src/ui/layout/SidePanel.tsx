import { SelectionContentPanel } from '../buildings/SelectionContentPanel.tsx';
import { SelectionMiniBar } from './SelectionMiniBar';
import { useSelectionExpansion } from './useSelectionExpansion';

export function SidePanel() {
  const { hasSelection, expanded, expand } = useSelectionExpansion();
  if (!hasSelection) return null;
  if (!expanded) {
    return (
      <div className="side-panel-mini">
        <SelectionMiniBar onExpand={expand} />
      </div>
    );
  }
  return (
    <aside className="side-panel">
      <SelectionContentPanel />
    </aside>
  );
}
