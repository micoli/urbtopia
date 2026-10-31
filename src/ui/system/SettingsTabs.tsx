import { t } from '../../i18n/t';
import type { SettingsTab } from '../../store/uiStore';
import type { IconName } from '../common/iconRegistry';
import { Tabs } from '../common/Tabs';

const TABS: readonly { id: SettingsTab; icon: IconName }[] = [
  { id: 'game', icon: 'game' },
  { id: 'display', icon: 'display' },
  { id: 'saves', icon: 'save' },
  { id: 'app', icon: 'info' },
];

interface SettingsTabsProps {
  tab: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
}

export function SettingsTabs({ tab, onSelect }: SettingsTabsProps) {
  const tabs = TABS.map(({ id, icon }) => ({ id, icon, label: t(`settings.tab.${id}`) }));
  return <Tabs label={t('settings.title')} idPrefix="settings-tab" panelId="settings-panel" tabs={tabs} selected={tab} onSelect={onSelect} />;
}
