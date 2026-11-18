import { createStore } from 'zustand/vanilla';
import { describe, expect, it, vi } from 'vitest';
import type { Prefs } from '../i18n/prefsStore';
import { DISPLAY_SETTINGS, installDisplaySettingsMetrics } from './displaySettingsMetrics';

const prefs = (values: Partial<Prefs>) => createStore<Prefs>(() => ({ ...Object.fromEntries(DISPLAY_SETTINGS.map((key) => [key, false])), ...values }) as Prefs);

describe('installDisplaySettingsMetrics', () => {
  it('reports every setting with its value at start', () => {
    const report = vi.fn();
    installDisplaySettingsMetrics(prefs({ traffic: true, layout: 'B' }), report);
    expect(report).toHaveBeenCalledTimes(DISPLAY_SETTINGS.length);
    expect(report).toHaveBeenCalledWith('display_setting', { setting: 'traffic', value: 'true' });
    expect(report).toHaveBeenCalledWith('display_setting', { setting: 'layout', value: 'B' });
  });

  it('reports only the setting that changed, with its new value', () => {
    const report = vi.fn();
    const store = prefs({});
    installDisplaySettingsMetrics(store, report);
    report.mockClear();
    store.setState({ sunShadows: true });
    expect(report).toHaveBeenCalledOnce();
    expect(report).toHaveBeenCalledWith('display_setting_changed', { setting: 'sunShadows', value: 'true' });
  });

  it('ignores a change outside the display settings', () => {
    const report = vi.fn();
    const store = prefs({});
    installDisplaySettingsMetrics(store, report);
    report.mockClear();
    store.setState({ debugOffset: 3 } as Partial<Prefs>);
    expect(report).not.toHaveBeenCalled();
  });
});
