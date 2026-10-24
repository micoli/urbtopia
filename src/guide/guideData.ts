import { CODEX_ENTRIES, CODEX_SECTIONS, codexImageKey, HOME_COLOR_VARIANTS, isHomeCodexId, type CodexEntry, type CodexManifest } from '../codex/catalog';
import { codexEntryOf, type GuideRoute } from './routes';

export interface GuideData {
  images: Record<string, string>;
}

export const firstImageOf = (entry: CodexEntry): string => codexImageKey(entry.id, entry.levels[0]!);

const imageKeysOf = (entry: CodexEntry): string[] => entry.levels.flatMap(level => isHomeCodexId(entry.id) ? HOME_COLOR_VARIANTS.map(variant => codexImageKey(entry.id, level, variant)) : [codexImageKey(entry.id, level)]);

function imageKeysOfPage({ page }: GuideRoute): string[] {
  if (page.kind === 'codexEntry') return imageKeysOf(codexEntryOf(page.id));
  if (page.kind === 'codexSection') return CODEX_ENTRIES.filter(entry => entry.section === page.section).map(firstImageOf);
  if (page.kind === 'codexIndex') return CODEX_SECTIONS.flatMap(section => CODEX_ENTRIES.filter(entry => entry.section === section).slice(0, 1).map(firstImageOf));
  return [];
}

export function guideDataOf(route: GuideRoute, manifest: CodexManifest): GuideData {
  return { images: Object.fromEntries(imageKeysOfPage(route).map(key => [key, manifest.images[key]!])) };
}
