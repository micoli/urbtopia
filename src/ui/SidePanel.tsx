import { SelectionContent } from './SelectionContent';
import { useSelectedBuilding } from './useSelectedBuilding';

export function SidePanel() {
  const building = useSelectedBuilding();
  if (!building) return null;
  return (
    <aside className="side-panel">
      <SelectionContent />
    </aside>
  );
}
