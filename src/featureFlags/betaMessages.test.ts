import { describe, expect, it } from 'vitest';
import { betaMessages } from '../i18n/beta';
import { FLAG_IDS } from './featureFlags';

describe('beta messages', () => {
  it.each(['en', 'fr'] as const)('name and describe every feature flag in %s', (language) => {
    const messages = betaMessages(language) as Record<string, string>;
    for (const id of FLAG_IDS) {
      expect(messages[`beta.flag.${id}`], id).toBeTruthy();
      expect(messages[`beta.flag.${id}.description`], id).toBeTruthy();
    }
  });
});
