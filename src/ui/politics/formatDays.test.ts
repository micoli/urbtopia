import { afterEach, describe, expect, it } from 'vitest';
import { prefsStore } from '../../i18n/prefsStore';
import { formatDays } from './formatDays';

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('formatDays', () => {
  it.each([[0, '0 days', '0 jours'], [1, '1 day', '1 jour'], [2, '2 days', '2 jours'], [10, '10 days', '10 jours']])('words %i in both languages', (count, en, fr) => {
    expect(formatDays(count)).toBe(en);
    prefsStore.getState().setLanguage('fr');
    expect(formatDays(count)).toBe(fr);
  });
});
