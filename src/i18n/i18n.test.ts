import { describe, expect, it } from 'vitest';
import { FR } from './fr';
import { MESSAGES } from './messages';
import { defaultLanguage, parsePrefs } from './prefsStore';

describe('catalogs', () => {
  it('translate every message key in French, and nothing more', () => {
    expect(Object.keys(FR).sort()).toEqual(Object.keys(MESSAGES).sort());
  });

  it('never leave a message empty', () => {
    for (const catalog of [FR, MESSAGES] as Record<string, string>[]) {
      for (const [key, text] of Object.entries(catalog)) expect(text.trim(), key).not.toBe('');
    }
  });

  it('keep the game name and the currency identical in both languages', () => {
    expect(FR['stat.urbs']).toBe(MESSAGES['stat.urbs']);
    expect(FR['import.wrong-format']).toContain('Urbtopia');
    expect(MESSAGES['import.wrong-format']).toContain('Urbtopia');
  });

  it('translate plain statements instead of copying the English text', () => {
    expect(FR['panel.close']).not.toBe(MESSAGES['panel.close']);
    expect(FR['error.notEnoughUrbs']).toContain('Urbs');
  });
});

describe('preferences', () => {
  it('picks French for French browsers and English otherwise', () => {
    expect(defaultLanguage('fr-FR')).toBe('fr');
    expect(defaultLanguage('fr')).toBe('fr');
    expect(defaultLanguage('en-US')).toBe('en');
    expect(defaultLanguage(undefined)).toBe('en');
  });

  it('reads stored preferences and falls back on bad values', () => {
    expect(parsePrefs(JSON.stringify({ language: 'fr', layout: 'B' }))).toEqual({ language: 'fr', layout: 'B' });
    expect(parsePrefs(JSON.stringify({ language: 'de', layout: 'Z' }), 'fr-FR')).toEqual({ language: 'fr', layout: 'C' });
    expect(parsePrefs('not json', 'en-GB')).toEqual({ language: 'en', layout: 'C' });
    expect(parsePrefs(null)).toEqual({ language: 'en', layout: 'C' });
  });
});
