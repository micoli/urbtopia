import type { MedalInfo } from '../challenges/types';
import { prefsStore } from './prefsStore';

function humanized(code: string): string {
  const words = code.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function medalName(medal: Pick<MedalInfo, 'medalCode' | 'nameFr' | 'nameEn'>): string {
  const written = prefsStore.getState().language === 'fr' ? medal.nameFr : medal.nameEn;
  return written?.trim() || humanized(medal.medalCode);
}
