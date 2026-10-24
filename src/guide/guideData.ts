import { codexImageKey, CODEX_ENTRIES, type CodexManifest } from '../codex/catalog';
import type { GuideRoute } from './routes';

export interface GuideData {
  images: Record<number, string>;
}

export function guideDataOf(route: GuideRoute, manifest: CodexManifest): GuideData {
  const { page } = route;
  if (page.kind !== 'codexEntry') return { images: {} };
  const entry = CODEX_ENTRIES.find(item => item.id === page.id)!;
  return { images: Object.fromEntries(entry.levels.map(level => [level, manifest.images[codexImageKey(entry.id, level)]!])) };
}
