import { afterEach, describe, expect, it, vi } from 'vitest';
import { PANEL_SECTIONS_KEY, readPanelSections, writePanelSection } from './panelSections';

function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) });
  return data;
}

afterEach(() => vi.unstubAllGlobals());

describe('panel sections', () => {
  it('opens Modifications and Usage and closes Help by default', () => {
    stubStorage();
    expect(readPanelSections()).toEqual({ modifications: true, usage: true, help: false });
  });

  it('remembers each section on its own', () => {
    stubStorage();
    writePanelSection('usage', false);
    writePanelSection('help', true);
    expect(readPanelSections()).toEqual({ modifications: true, usage: false, help: true });
  });

  it('falls back on the default for a value that is not a boolean, and on bad JSON', () => {
    stubStorage({ [PANEL_SECTIONS_KEY]: JSON.stringify({ modifications: 'no', usage: false }) });
    expect(readPanelSections()).toEqual({ modifications: true, usage: false, help: false });
    stubStorage({ [PANEL_SECTIONS_KEY]: 'not json' });
    expect(readPanelSections()).toEqual({ modifications: true, usage: true, help: false });
  });

  it('works without a storage', () => {
    expect(readPanelSections()).toEqual({ modifications: true, usage: true, help: false });
    expect(() => writePanelSection('help', true)).not.toThrow();
  });
});
