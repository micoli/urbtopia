export const DEVTOOLS_POSITION_KEY = 'urbtopia-devtools-position';
export const DEVTOOLS_SECTIONS_KEY = 'urbtopia-devtools-sections';

export interface DevToolsPosition {
  x: number;
  y: number;
}

export type DevToolsSectionId = 'flags' | 'warehouse' | 'annualEvents' | 'items';

export function readDevToolsPosition(): DevToolsPosition | null {
  try {
    const stored = JSON.parse(localStorage.getItem(DEVTOOLS_POSITION_KEY) ?? 'null') as Partial<DevToolsPosition> | null;
    if (typeof stored?.x !== 'number' || typeof stored.y !== 'number') return null;
    return { x: stored.x, y: stored.y };
  } catch {
    return null;
  }
}

export function writeDevToolsPosition(position: DevToolsPosition): void {
  try {
    localStorage.setItem(DEVTOOLS_POSITION_KEY, JSON.stringify(position));
  } catch {
    return;
  }
}

export function readDevToolsSection(id: DevToolsSectionId): boolean {
  try {
    const stored = JSON.parse(localStorage.getItem(DEVTOOLS_SECTIONS_KEY) ?? '{}') as Partial<Record<DevToolsSectionId, unknown>>;
    return typeof stored[id] === 'boolean' ? stored[id] : true;
  } catch {
    return true;
  }
}

export function writeDevToolsSection(id: DevToolsSectionId, expanded: boolean): void {
  try {
    const stored = JSON.parse(localStorage.getItem(DEVTOOLS_SECTIONS_KEY) ?? '{}') as Record<string, unknown>;
    localStorage.setItem(DEVTOOLS_SECTIONS_KEY, JSON.stringify({ ...stored, [id]: expanded }));
  } catch {
    return;
  }
}
