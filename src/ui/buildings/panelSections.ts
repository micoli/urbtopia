export const PANEL_SECTIONS_KEY = 'urbtopia-panel-sections';

export type PanelSectionId = 'modifications' | 'usage' | 'help';

const PANEL_SECTION_IDS: PanelSectionId[] = ['modifications', 'usage', 'help'];
const DEFAULTS: Record<PanelSectionId, boolean> = { modifications: true, usage: true, help: false };

export function readPanelSections(): Record<PanelSectionId, boolean> {
  try {
    const stored = JSON.parse(localStorage.getItem(PANEL_SECTIONS_KEY) ?? '{}') as Partial<Record<PanelSectionId, unknown>>;
    return Object.fromEntries(PANEL_SECTION_IDS.map((id) => [id, typeof stored[id] === 'boolean' ? stored[id] : DEFAULTS[id]])) as Record<PanelSectionId, boolean>;
  } catch {
    return { ...DEFAULTS };
  }
}

export function writePanelSection(id: PanelSectionId, expanded: boolean): void {
  try {
    localStorage.setItem(PANEL_SECTIONS_KEY, JSON.stringify({ ...readPanelSections(), [id]: expanded }));
  } catch {
    return;
  }
}
