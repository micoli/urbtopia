import { describe, expect, it } from 'vitest';
import { politicsBalanceSchema } from '../balance/balanceSchemas';
import politicsFile from '../../../assets/defs/balance/politics.json';
import { DIFFICULTIES, FACTION_IDS, OBJECTIVE_ENTRIES, ORDINANCE_ENTRIES, POLITICS, politicsRuleOf } from '../index';
import { objectiveSchema } from './objectiveSchema';
import { ordinanceSchema } from './ordinanceSchema';

const bare = <T extends { id: string }>(entry: T): Omit<T, 'id'> => {
  const { id, ...definition } = entry;
  return id ? definition : definition;
};
const validBalance = (value: unknown) => politicsBalanceSchema.safeParse(value).success;
const withDifficulty = (id: string, rule: unknown) => ({ ...politicsFile, difficulties: { ...politicsFile.difficulties, [id]: rule } });

describe('Politics balance', () => {
  it('is valid', () => {
    expect(validBalance(politicsFile)).toBe(true);
  });

  it('has a rule for every Difficulty', () => {
    expect(Object.keys(POLITICS.difficulties)).toEqual([...DIFFICULTIES]);
  });

  it('has no politics under Cozy', () => {
    expect(politicsRuleOf('cozy').active).toBe(false);
  });

  it.each(['easy', 'medium', 'hard'] as const)('has politics under %s', difficulty => {
    expect(politicsRuleOf(difficulty).active).toBe(true);
  });

  it('keeps what an easier Difficulty has', () => {
    expect(validBalance(withDifficulty('hard', { ...politicsFile.difficulties.hard, election: false }))).toBe(false);
  });

  it('refuses politics under Cozy', () => {
    expect(validBalance(withDifficulty('cozy', { ...politicsFile.difficulties.cozy, active: true }))).toBe(false);
  });

  it('seats every Faction', () => {
    expect(Object.keys(POLITICS.council.seats)).toEqual([...FACTION_IDS]);
    expect(validBalance({ ...politicsFile, council: { ...politicsFile.council, seats: { economy: 3, environment: 3 } } })).toBe(false);
  });

  it('refuses an unknown field', () => {
    expect(validBalance({ ...politicsFile, extra: 1 })).toBe(false);
  });
});

describe('Ordinances', () => {
  const launch = ['taxRelief', 'taxIncrease', 'wasteSorting', 'greenBelt', 'transitSubsidy', 'energySaving', 'officeRelief', 'culturalFestival'];

  it('holds the launch catalogue', () => {
    expect(ORDINANCE_ENTRIES.map(entry => entry.id)).toEqual(launch);
  });

  it.each(ORDINANCE_ENTRIES.map(entry => [entry.id, entry] as const))('%s is valid', (_id, entry) => {
    expect(ordinanceSchema.safeParse(bare(entry)).success).toBe(true);
  });

  it('has a stance for every Faction, in each Ordinance', () => {
    for (const entry of ORDINANCE_ENTRIES) expect(Object.keys(entry.stances)).toEqual([...FACTION_IDS]);
  });

  it('refuses a stance out of range', () => {
    const taxRelief = bare(ORDINANCE_ENTRIES[0]!);
    expect(ordinanceSchema.safeParse({ ...taxRelief, stances: { ...taxRelief.stances, economy: 3 } }).success).toBe(false);
  });

  it('refuses an unknown effect kind', () => {
    const taxRelief = bare(ORDINANCE_ENTRIES[0]!);
    expect(ordinanceSchema.safeParse({ ...taxRelief, effect: { kind: 'martialLaw' } }).success).toBe(false);
  });

  it('puts every exclusive group on at least two Ordinances', () => {
    const groups = ORDINANCE_ENTRIES.flatMap(entry => (entry.exclusiveGroup ? [entry.exclusiveGroup] : []));
    for (const group of new Set(groups)) expect(groups.filter(candidate => candidate === group).length).toBeGreaterThanOrEqual(2);
  });

  it('has a Tax level of three: standard, relief and increase', () => {
    const tax = ORDINANCE_ENTRIES.filter(entry => entry.exclusiveGroup === 'tax');
    expect(tax.map(entry => entry.id)).toEqual(['taxRelief', 'taxIncrease']);
  });
});

describe('Objectives', () => {
  it.each(OBJECTIVE_ENTRIES.map(entry => [entry.id, entry] as const))('%s is valid', (_id, entry) => {
    expect(objectiveSchema.safeParse(bare(entry)).success).toBe(true);
  });

  it('covers every family of the launch catalogue', () => {
    expect(new Set(OBJECTIVE_ENTRIES.map(entry => entry.metric))).toEqual(new Set(['vitalSatisfaction', 'wasteCoverage', 'congestion', 'greenShare', 'citizens']));
  });

  it('refuses a share above 1', () => {
    const cleanCity = bare(OBJECTIVE_ENTRIES.find(entry => entry.metric === 'wasteCoverage')!);
    expect(objectiveSchema.safeParse({ ...cleanCity, target: 1.5 }).success).toBe(false);
  });

  it('refuses a fractional number of Citizens', () => {
    const growth = bare(OBJECTIVE_ENTRIES.find(entry => entry.metric === 'citizens')!);
    expect(objectiveSchema.safeParse({ ...growth, target: 10.5 }).success).toBe(false);
  });

  it('refuses a satisfaction above 100', () => {
    const vital = bare(OBJECTIVE_ENTRIES.find(entry => entry.metric === 'vitalSatisfaction')!);
    expect(objectiveSchema.safeParse({ ...vital, target: 120 }).success).toBe(false);
  });

  it('refuses a hold of zero days', () => {
    const growth = bare(OBJECTIVE_ENTRIES[0]!);
    expect(objectiveSchema.safeParse({ ...growth, holdDays: 0 }).success).toBe(false);
  });
});
