import { SelectionContentPanel } from '../buildings/SelectionContentPanel.tsx';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';

export function SidePanel() {
  const building = useSelectedBuilding();
  if (!building) return null;
  return (
    <aside className="side-panel">
      <SelectionContentPanel />
    </aside>
  );
}
