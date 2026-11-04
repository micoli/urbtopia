import { SelectionContentPanel } from '../buildings/SelectionContentPanel.tsx';
import { useSelectedAccess } from '../buildings/useSelectedAccess';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';

export function SidePanel() {
  const building = useSelectedBuilding();
  const access = useSelectedAccess();
  if (!building && !access) return null;
  return (
    <aside className="side-panel">
      <SelectionContentPanel />
    </aside>
  );
}
