import { isGood, isMaterial, type ItemId } from '../core';
import { DAILY_HOOK_COUNT, EVENT_HOOK_COUNT, type ChallengeMessageKey } from './challenges';
import { itemName } from './itemName';
import { prefsStore } from './prefsStore';
import { t } from './t';

export type ChallengeNameSource = {
  kind: 'daily' | 'event';
  nameKeys: { hook: number; item: string };
  nameFr: string | null;
  nameEn: string | null;
};

function writtenName({ nameFr, nameEn }: ChallengeNameSource): string | undefined {
  const name = prefsStore.getState().language === 'fr' ? nameFr : nameEn;
  return name?.trim() || undefined;
}

function themeOf(item: string): string {
  if (!isMaterial(item) && !isGood(item)) return item;
  return itemName(item as ItemId);
}

export function generatedChallengeName({ kind, nameKeys }: ChallengeNameSource): string {
  const count = kind === 'daily' ? DAILY_HOOK_COUNT : EVENT_HOOK_COUNT;
  const hook = ((Math.trunc(nameKeys.hook) % count) + count) % count;
  const key = `challenge.${kind}.${hook}` as ChallengeMessageKey;
  return t(key).replace('{item}', themeOf(nameKeys.item));
}

export function challengeName(source: ChallengeNameSource): string {
  return writtenName(source) ?? generatedChallengeName(source);
}
