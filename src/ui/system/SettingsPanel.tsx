import { SettingsContent } from './SettingsContent';
import { useUi } from '../common/hooks';

export function SettingsPanel() {
  const open = useUi((store) => store.settingsOpen);
  if (!open) return null;
  return (
    <aside className="market-panel">
      <SettingsContent />
    </aside>
  );
}
