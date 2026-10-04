import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES } from './catalog';
import { levelFactsOf } from './levelFacts';

describe('levelFactsOf', () => {
  it('shows no change on the first level', () => {
    expect(levelFactsOf('home', 1).every(fact => fact.change === null)).toBe(true);
  });

  it('shows the gain brought by a home upgrade', () => {
    const citizens = levelFactsOf('home', 2).find(fact => fact.label === 'codex.fact.citizens');
    expect(citizens).toEqual({ label: 'codex.fact.citizens', value: '15', change: '+9' });
  });

  it('shows a decrease for production time', () => {
    const time = levelFactsOf('workshop', 2).find(fact => fact.label === 'codex.fact.craftTime');
    expect(time?.value).toBe('75%');
    expect(time?.change).toBe('−25%');
  });

  it('gives facts to every upgradable entry on its upper levels', () => {
    for (const entry of CODEX_ENTRIES.filter(entry => entry.levels.length > 1 && entry.section !== 'codex.crops')) {
      const hasFacts = entry.levels.every(level => levelFactsOf(entry.id, level).length > 0);
      expect(hasFacts, entry.id).toBe(true);
    }
  });
});
