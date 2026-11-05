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

  it('shows the impact of a production building, growing with its Tier', () => {
    const impact = levelFactsOf('factory', 2).find(fact => fact.label === 'codex.fact.emissions');
    expect(impact?.value).toBe('4 impact units / hour');
    expect(impact?.change).toBe('+2');
  });

  it('shows no impact for a production building that emits none', () => {
    expect(levelFactsOf('packhouse', 1).some(fact => fact.label === 'codex.fact.emissions')).toBe(false);
  });

  it('gives facts to every upgradable entry on its upper levels', () => {
    for (const entry of CODEX_ENTRIES.filter(entry => entry.levels.length > 1 && entry.section !== 'codex.crops')) {
      const hasFacts = entry.levels.every(level => levelFactsOf(entry.id, level).length > 0);
      expect(hasFacts, entry.id).toBe(true);
    }
  });

  it('shows the Waste cost of a facility at its Tier capacity', () => {
    const cost = levelFactsOf('incinerator', 2).find(fact => fact.label === 'codex.fact.wasteCostDay');
    expect(cost?.value).toBe('4500–9000 Urbs / day');
    expect(cost?.change).toBe('+2100');
  });

  it('shows the cost per unit supplied by the Backup power plant', () => {
    const cost = levelFactsOf('backup', 1).find(fact => fact.label === 'codex.fact.supplyCostHour');
    expect(cost?.value).toBe('12 Urbs / hour');
  });

  it('gives no running cost to a building without one', () => {
    expect(levelFactsOf('home', 1).some(fact => fact.label.startsWith('codex.fact.wages'))).toBe(false);
  });
});
