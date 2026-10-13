import { afterEach, describe, expect, it } from 'vitest';
import { GOOD_ENTRIES, MATERIAL_ENTRIES } from '../core/economy/items';
import { challengeName, generatedChallengeName, type ChallengeNameSource } from './challengeName';
import { DAILY_HOOK_COUNT, EVENT_HOOK_COUNT } from './challenges';
import { FR } from './fr';
import { MESSAGES } from './messages';
import { prefsStore } from './prefsStore';

const daily = (hook: number, item = 'planks'): ChallengeNameSource => ({ kind: 'daily', nameKeys: { hook, item }, nameFr: null, nameEn: null });

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('generatedChallengeName', () => {
  it('gives the same name for the same keys', () => {
    expect(generatedChallengeName(daily(3))).toBe(generatedChallengeName(daily(3)));
  });

  it('wraps a large hook around the list', () => {
    expect(generatedChallengeName(daily(DAILY_HOOK_COUNT + 2))).toBe(generatedChallengeName(daily(2)));
    expect(generatedChallengeName(daily(-1))).toBe(generatedChallengeName(daily(DAILY_HOOK_COUNT - 1)));
  });

  it('uses another hook list for an Event', () => {
    const event: ChallengeNameSource = { ...daily(0), kind: 'event' };
    expect(generatedChallengeName(event)).not.toBe(generatedChallengeName(daily(0)));
  });

  it('is written in the player language', () => {
    prefsStore.getState().setLanguage('fr');
    expect(generatedChallengeName(daily(0))).toBe('Ruée sur Planches');
    prefsStore.getState().setLanguage('en');
    expect(generatedChallengeName(daily(0))).toBe('Planks rush');
  });

  it('keeps an unknown item id as its theme', () => {
    expect(generatedChallengeName(daily(0, 'unobtainium'))).toBe('unobtainium rush');
  });

  it('names every item of the catalogue in both languages', () => {
    for (const language of ['en', 'fr'] as const) {
      prefsStore.getState().setLanguage(language);
      for (const { id, name } of [...MATERIAL_ENTRIES, ...GOOD_ENTRIES]) {
        for (let hook = 0; hook < DAILY_HOOK_COUNT; hook++) expect(generatedChallengeName(daily(hook, id)), `${id} ${language} ${hook}`).toContain(name[language]);
      }
    }
  });
});

describe('challengeName', () => {
  const written: ChallengeNameSource = { kind: 'event', nameKeys: { hook: 0, item: 'planks' }, nameFr: 'Fête du port', nameEn: 'Port festival' };

  it('prefers the hand-written name of an Event in the player language', () => {
    expect(challengeName(written)).toBe('Port festival');
    prefsStore.getState().setLanguage('fr');
    expect(challengeName(written)).toBe('Fête du port');
  });

  it('falls back on the generated name when the written one is missing or blank', () => {
    expect(challengeName({ ...written, nameEn: null })).toBe(generatedChallengeName(written));
    expect(challengeName({ ...written, nameEn: '  ' })).toBe(generatedChallengeName(written));
  });

  it('falls back only for the missing language', () => {
    prefsStore.getState().setLanguage('fr');
    expect(challengeName({ ...written, nameEn: null })).toBe('Fête du port');
  });
});

describe('hook lists', () => {
  it('have a text in both languages for every hook, each with the item placeholder', () => {
    for (const [kind, count] of [['daily', DAILY_HOOK_COUNT], ['event', EVENT_HOOK_COUNT]] as const) {
      for (let hook = 0; hook < count; hook++) {
        const key = `challenge.${kind}.${hook}` as keyof typeof MESSAGES;
        expect(MESSAGES[key], key).toContain('{item}');
        expect(FR[key], key).toContain('{item}');
      }
    }
    expect(Object.keys(MESSAGES).filter((key) => key.startsWith('challenge.daily.'))).toHaveLength(DAILY_HOOK_COUNT);
    expect(Object.keys(MESSAGES).filter((key) => key.startsWith('challenge.event.'))).toHaveLength(EVENT_HOOK_COUNT);
  });
});
