import { describe, expect, it } from 'vitest';
import { ORDINANCE_ENTRIES } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { ordinanceEffectText } from './ordinanceEffectText';

describe('ordinanceEffectText', () => {
  it.each(['en', 'fr'] as const)('words every Ordinance, with its values filled in, in %s', language => {
    prefsStore.getState().setLanguage(language);
    for (const entry of ORDINANCE_ENTRIES) {
      const text = ordinanceEffectText(entry.effect);
      expect(text).not.toContain('{');
      expect(text).not.toContain('undefined');
      expect(text.length).toBeGreaterThan(3);
    }
    prefsStore.getState().setLanguage('en');
  });

  it('shows shares as percentages and multipliers as they are', () => {
    prefsStore.getState().setLanguage('en');
    expect(ordinanceEffectText({ kind: 'wasteSorting', reduction: 0.25 })).toBe('Waste −25 %');
    expect(ordinanceEffectText({ kind: 'taxMultiplier', multiplier: 1.15 })).toBe('Tax ×1.15');
  });
});
