import { SelectionContent } from '../buildings/SelectionContent';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';

export function SidePanel() {
  const building = useSelectedBuilding();
  if (!building) return null;
  return (
    <aside className="side-panel">
      <SelectionContent />
    </aside>
  );
}
