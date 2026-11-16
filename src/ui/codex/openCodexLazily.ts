import type { CodexId } from '../../codex/catalog';
import type { CodexPage } from '../../codex/pages';

// The store of the city is loaded on demand, so that a menu can be drawn without it.
export const openCodexLazily = (page: CodexPage, fixture?: string): Promise<void> => import('../../store/uiStore').then(({ uiStore }) => uiStore.getState().openCodex(undefined, page, fixture));

export const openBuildingCodexLazily = (entry?: CodexId): Promise<void> => import('../../store/uiStore').then(({ uiStore }) => uiStore.getState().openCodex(entry));
