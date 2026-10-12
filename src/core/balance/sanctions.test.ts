import { describe, expect, it } from 'vitest';
import { sanctionsBalanceSchema } from './balanceSchemas';
import sanctionsFile from '../../../assets/defs/balance/sanctions.json';
import { DIFFICULTIES, NEED_FACTOR_IDS, SANCTIONABLE_FACTOR_IDS, SANCTIONS, needsPyramid, newGame, sanctionedFactors } from '../index';

const withDifficulty = (id: string, rule: unknown) => ({ difficulties: { ...sanctionsFile.difficulties, [id]: rule } });
const valid = (value: unknown) => sanctionsBalanceSchema.safeParse(value).success;

describe('Sanctions balance', () => {
  it('is valid', () => {
    expect(valid(sanctionsFile)).toBe(true);
  });

  it('has a rule for every Difficulty', () => {
    expect(Object.keys(SANCTIONS)).toEqual([...DIFFICULTIES]);
  });

  it('sanctions nothing under Cozy', () => {
    expect(sanctionedFactors('cozy')).toEqual([]);
  });

  it.each([
    ['easy', ['safety', 'health']],
    ['medium', ['safety', 'health', 'pollution', 'congestion']],
    ['hard', ['safety', 'health', 'pollution', 'congestion', 'climate']],
  ] as const)('sanctions the expected factors under %s', (difficulty, factors) => {
    expect(sanctionedFactors(difficulty)).toEqual(expect.arrayContaining([...factors, 'electricity', 'water']));
    expect(sanctionedFactors(difficulty)).toHaveLength(factors.length + 2);
  });

  it('keeps every sanctioned factor of a Difficulty in the next one', () => {
    DIFFICULTIES.forEach((difficulty, index) => {
      const previous = DIFFICULTIES[index - 1];
      if (previous) expect(sanctionedFactors(difficulty)).toEqual(expect.arrayContaining([...sanctionedFactors(previous)]));
    });
  });

  it('never lets a Home lose more than half its Tax once sanctions apply, and none of its Citizens', () => {
    for (const difficulty of DIFFICULTIES.slice(1)) {
      expect(SANCTIONS[difficulty].taxFloor).toBeGreaterThanOrEqual(0.5);
      expect(SANCTIONS[difficulty].citizenLossSeverity).toBe(0);
    }
  });

  it('only names factors that are Vital or Safety Need factors, and not food', () => {
    const levels = new Map(needsPyramid(newGame({ seed: 'sanctions', now: 0 })).levels.flatMap(level => level.factors.map(factor => [factor.id, level.id] as const)));
    for (const factor of SANCTIONABLE_FACTOR_IDS) expect(['vital', 'safety']).toContain(levels.get(factor));
    expect(SANCTIONABLE_FACTOR_IDS).not.toContain('food');
    expect(NEED_FACTOR_IDS).toEqual(expect.arrayContaining([...SANCTIONABLE_FACTOR_IDS]));
  });

  it.each([
    ['an unknown factor', withDifficulty('easy', { ...SANCTIONS.easy, factors: ['safety', 'astrology'] })],
    ['a factor that is not sanctionable', withDifficulty('easy', { ...SANCTIONS.easy, factors: ['safety', 'culture'] })],
    ['food', withDifficulty('easy', { ...SANCTIONS.easy, factors: ['food'] })],
    ['a factor listed twice', withDifficulty('easy', { ...SANCTIONS.easy, factors: ['safety', 'safety'] })],
    ['a Cozy that sanctions something', withDifficulty('cozy', { ...SANCTIONS.cozy, factors: ['safety'] })],
    ['a Difficulty that drops a factor of the one before', withDifficulty('hard', { ...SANCTIONS.hard, factors: ['safety'] })],
    ['a null Tax floor', withDifficulty('easy', { ...SANCTIONS.easy, taxFloor: 0 })],
    ['a Tax floor above 1', withDifficulty('easy', { ...SANCTIONS.easy, taxFloor: 1.2 })],
    ['an unknown Difficulty', { difficulties: { ...sanctionsFile.difficulties, brutal: SANCTIONS.hard } }],
    ['a missing Difficulty', { difficulties: { cozy: SANCTIONS.cozy, easy: SANCTIONS.easy, medium: SANCTIONS.medium } }],
  ])('rejects %s', (_label, value) => {
    expect(valid(value)).toBe(false);
  });
});
