import { MenuContent } from './MenuContent';
import { useUi } from './hooks';

export function MenuPanel() {
  const open = useUi((store) => store.menuOpen);
  if (!open) return null;
  return (
    <aside className="market-panel">
      <MenuContent />
    </aside>
  );
}
