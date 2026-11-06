import type { SettingsTab } from '../../store/uiStore';

const ALWAYS: readonly SettingsTab[] = ['game', 'display', 'saves', 'app'];

// The Reports tab belongs to the beta: it needs the Player to have joined it, and the online service.
export function visibleSettingsTabs(betaSubscribed: boolean, cloudEnabled: boolean): readonly SettingsTab[] {
  return betaSubscribed && cloudEnabled ? [...ALWAYS, 'reports'] : ALWAYS;
}

export function shownSettingsTab(tab: SettingsTab, visible: readonly SettingsTab[]): SettingsTab {
  return visible.includes(tab) ? tab : 'game';
}
