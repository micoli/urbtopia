import type { ComponentType } from 'react';
import { useStore } from 'zustand';
import { featureFlagStore } from '../../featureFlags/featureFlags';
import { t } from '../../i18n/t';
import { cloudStore } from '../../store/cloudStore';
import type { SettingsTab } from '../../store/uiStore';
import { ReportsSettings } from '../bugReport/ReportsSettings';
import { useBugReportInbox } from '../bugReport/useBugReportInbox';
import { useUi } from '../common/hooks';
import { PanelHeader } from '../common/PanelHeader';
import { AppSettings } from './AppSettings';
import { DisplaySettings } from './DisplaySettings';
import { GameSettings } from './GameSettings';
import { SavesSettings } from './SavesSettings';
import { SettingsTabs } from './SettingsTabs';
import { shownSettingsTab, visibleSettingsTabs } from './visibleSettingsTabs';

const PANELS: Record<SettingsTab, ComponentType> = { game: GameSettings, display: DisplaySettings, saves: SavesSettings, app: AppSettings, reports: ReportsSettings };

export function SettingsContent() {
  const toggle = useUi((store) => store.toggleSettings);
  const chosen = useUi((store) => store.settingsTab);
  const setTab = useUi((store) => store.setSettingsTab);
  const betaSubscribed = useStore(featureFlagStore, (store) => store.subscribed);
  const cloudEnabled = useStore(cloudStore, (store) => store.enabled);
  const unreadReports = useBugReportInbox((store) => store.unread);
  const visible = visibleSettingsTabs(betaSubscribed, cloudEnabled);
  const tab = shownSettingsTab(chosen, visible);
  const Panel = PANELS[tab];

  return (
    <>
      <PanelHeader title={t('settings.title')} onClose={toggle} />
      <SettingsTabs tab={tab} visible={visible} unreadReports={unreadReports} onSelect={setTab} />
      <div key={tab} id="settings-panel" className="settings-panel" role="tabpanel" aria-labelledby={`settings-tab-${tab}`}>
        <Panel />
      </div>
    </>
  );
}
