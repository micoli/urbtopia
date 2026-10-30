import type { ComponentType } from 'react';
import { t } from '../../i18n/t';
import type { SettingsTab } from '../../store/uiStore';
import { useUi } from '../common/hooks';
import { PanelHeader } from '../common/PanelHeader';
import { AppSettings } from './AppSettings';
import { DisplaySettings } from './DisplaySettings';
import { GameSettings } from './GameSettings';
import { SavesSettings } from './SavesSettings';
import { SettingsTabs } from './SettingsTabs';

const PANELS: Record<SettingsTab, ComponentType> = { game: GameSettings, display: DisplaySettings, saves: SavesSettings, app: AppSettings };

export function SettingsContent() {
  const toggle = useUi((store) => store.toggleSettings);
  const tab = useUi((store) => store.settingsTab);
  const setTab = useUi((store) => store.setSettingsTab);
  const Panel = PANELS[tab];

  return (
    <>
      <PanelHeader title={t('settings.title')} onClose={toggle} />
      <SettingsTabs tab={tab} onSelect={setTab} />
      <div key={tab} id="settings-panel" className="settings-panel" role="tabpanel" aria-labelledby={`settings-tab-${tab}`}>
        <Panel />
      </div>
    </>
  );
}
