import { CODEX_ENTRIES } from '../../codex/catalog';
import { isDifficulty, type Difficulty } from '../../core';

export interface ReaderSettings {
  difficulty: Difficulty;
  citizens: number;
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = { difficulty: 'medium', citizens: 0 };

export const CITIZEN_STEPS: readonly number[] = [...new Set([0, ...CODEX_ENTRIES.map(entry => entry.unlockCitizens)])].sort((a, b) => a - b);

export function readerSettingsOf(search: string): ReaderSettings | null {
  const params = new URLSearchParams(search);
  const difficulty = params.get('difficulty');
  const citizens = Number(params.get('citizens'));
  if (!isDifficulty(difficulty) && !params.has('citizens')) return null;
  return {
    difficulty: isDifficulty(difficulty) ? difficulty : DEFAULT_READER_SETTINGS.difficulty,
    citizens: Number.isInteger(citizens) && citizens >= 0 ? citizens : DEFAULT_READER_SETTINGS.citizens,
  };
}

export function searchOf(settings: ReaderSettings): string {
  return `?difficulty=${settings.difficulty}&citizens=${settings.citizens}`;
}
