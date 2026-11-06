import { describe, expect, it } from 'vitest';
import { shownSettingsTab, visibleSettingsTabs } from './visibleSettingsTabs';

describe('visibleSettingsTabs', () => {
  it('adds Reports only for a beta member with the online service', () => {
    expect(visibleSettingsTabs(true, true)).toContain('reports');
    expect(visibleSettingsTabs(false, true)).not.toContain('reports');
    expect(visibleSettingsTabs(true, false)).not.toContain('reports');
  });

  it('falls back to the Game tab when the chosen tab is gone', () => {
    expect(shownSettingsTab('reports', visibleSettingsTabs(false, true))).toBe('game');
    expect(shownSettingsTab('reports', visibleSettingsTabs(true, true))).toBe('reports');
    expect(shownSettingsTab('app', visibleSettingsTabs(false, false))).toBe('app');
  });
});
