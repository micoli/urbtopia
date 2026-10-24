import { isCrop } from '../core';
import { t } from '../i18n/t';
import type { CodexEntry } from './catalog';

export function levelCaptionOf(entry: CodexEntry, level: number): string {
  if (!isCrop(entry.id)) return t('codex.level').replace('{level}', String(level));
  return level > 4 ? t('codex.stageReady') : t('codex.stage').replace('{level}', String(level));
}
