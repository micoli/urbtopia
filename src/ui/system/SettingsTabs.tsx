import { t } from '../../i18n/t';
import type { SettingsTab } from '../../store/uiStore';
import type { IconName } from '../common/iconRegistry';
import { Tabs } from '../common/Tabs';

const ICONS: Record<SettingsTab, IconName> = { game: 'game', display: 'display', saves: 'save', app: 'info', reports: 'messages' };

interface SettingsTabsProps {
  tab: SettingsTab;
  visible: readonly SettingsTab[];
  unreadReports: number;
  onSelect: (tab: SettingsTab) => void;
}

export function SettingsTabs({ tab, visible, unreadReports, onSelect }: SettingsTabsProps) {
  const tabs = visible.map((id) => ({ id, icon: ICONS[id], label: t(`settings.tab.${id}`), count: id === 'reports' ? unreadReports : 0 }));
  return <Tabs label={t('settings.title')} idPrefix="settings-tab" panelId="settings-panel" tabs={tabs} selected={tab} onSelect={onSelect} />;
}
