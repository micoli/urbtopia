import { describe, expect, it } from 'vitest';
import { advance, dispatch, grantOf, OBJECTIVE_ENTRIES, objectiveValue, POLITICS, type Command, type GameState, type ObjectiveId } from '../index';
import { judgeObjectives } from './objectiveTracking';
import { DAY, T0, politicalCity, withApproval } from './testSupport';

const withObjectives = (state: GameState, ids: ObjectiveId[], completed: ObjectiveId[] = []): GameState => ({
  ...state,
  politics: { ...state.politics!, objectives: ids.map(id => ({ id, heldDays: 0 })), completed },
});

const activeIds = (state: GameState) => state.politics!.objectives.map(({ id }) => id);

function run(state: GameState, command: Command, now = T0) {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(result.error.key);
  return result;
}

describe('Active Objectives', () => {
  it('fills the places at activation with distinct Objectives the city is big enough for', () => {
    const ids = activeIds(politicalCity());
    expect(ids).toHaveLength(POLITICS.objectives.activeCount);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(OBJECTIVE_ENTRIES.find(entry => entry.id === id)!.unlockCitizens).toBeLessThanOrEqual(400);
  });

  it('draws the same Objectives for the same Seed', () => {
    expect(activeIds(politicalCity())).toEqual(activeIds(politicalCity()));
  });

  it('measures the city', () => {
    const city = politicalCity();
    expect(objectiveValue(city, 'citizens')).toBe(400);
    expect(objectiveValue({ ...city, buildings: [] }, 'citizens')).toBe(0);
    expect(objectiveValue({ ...city, buildings: [] }, 'wasteCoverage')).toBeNull();
  });
});

describe('Judging Objectives', () => {
  const city = politicalCity();

  it('pays the Grant of an Objective that is held long enough, and replaces it', () => {
    const held = advance(withObjectives(city, ['growth100', 'growth1000']), T0 + DAY).state;
    expect(held.politics!.grantsDue).toBe(OBJECTIVE_ENTRIES.find(entry => entry.id === 'growth100')!.grant);
    expect(held.politics!.completed).toEqual(['growth100']);
    expect(activeIds(held)).not.toContain('growth100');
    expect(activeIds(held)).toHaveLength(POLITICS.objectives.activeCount);
  });

  it('keeps an Objective whose target is not reached, at zero days held', () => {
    const missed = advance(withObjectives(city, ['growth1000']), T0 + DAY).state;
    expect(missed.politics!.grantsDue).toBe(0);
    expect(missed.politics!.objectives.find(objective => objective.id === 'growth1000')).toEqual({ id: 'growth1000', heldDays: 0 });
  });

  it('counts the days an Objective is held, and starts again when it is lost', () => {
    const politics = withObjectives(city, ['vitalComfort']).politics!;
    const only = (_state: GameState, id: ObjectiveId) => id === 'vitalComfort';
    const once = judgeObjectives(city, politics, only);
    expect(once.objectives).toEqual([expect.objectContaining({ id: 'vitalComfort', heldDays: 1 }), ...once.objectives.slice(1)]);
    const twice = judgeObjectives(city, once, only);
    expect(twice.objectives[0]).toEqual({ id: 'vitalComfort', heldDays: 2 });
    expect(twice.grantsDue).toBe(0);
    const lost = judgeObjectives(city, twice, () => false);
    expect(lost.objectives[0]).toEqual({ id: 'vitalComfort', heldDays: 0 });
    const done = judgeObjectives(city, twice, only);
    expect(done.grantsDue).toBe(OBJECTIVE_ENTRIES.find(entry => entry.id === 'vitalComfort')!.grant);
    expect(done.completed).toContain('vitalComfort');
  });

  it('never proposes an Objective done in the cycle, and starts the cycle again when all are done', () => {
    const all = OBJECTIVE_ENTRIES.map(entry => entry.id);
    const exhausted = advance(withObjectives(city, ['growth100'], all.filter(id => id !== 'growth100')), T0 + DAY).state;
    expect(exhausted.politics!.completed.length).toBeLessThan(all.length);
    expect(activeIds(exhausted)).toHaveLength(POLITICS.objectives.activeCount);
  });

  it('gives the same state in one go as in steps', () => {
    const base = withObjectives(city, ['growth100', 'growth300', 'growth1000']);
    // The offline replay stops at two game days.
    const oneGo = advance(base, T0 + 2 * DAY).state;
    const steps = advance(advance(base, T0 + DAY).state, T0 + 2 * DAY).state;
    expect(JSON.stringify(steps.politics)).toBe(JSON.stringify(oneGo.politics));
  });
});

describe('Grant amount', () => {
  const base = OBJECTIVE_ENTRIES.find(entry => entry.id === 'growth100')!.grant;

  it.each(['easy', 'medium'] as const)('is fixed under %s', difficulty => {
    const city = politicalCity(difficulty);
    expect(grantOf(withApproval(city, 0), 'growth100')).toBe(base);
    expect(grantOf(withApproval(city, 100), 'growth100')).toBe(base);
  });

  it('follows the Approval under Hard', () => {
    const city = politicalCity('hard');
    expect(grantOf(withApproval(city, 0), 'growth100')).toBe(Math.round(base * POLITICS.objectives.grantScale.atZeroApproval));
    expect(grantOf(withApproval(city, 100), 'growth100')).toBe(Math.round(base * POLITICS.objectives.grantScale.atFullApproval));
    expect(grantOf(withApproval(city, 100), 'growth100')).toBeGreaterThan(grantOf(withApproval(city, 0), 'growth100'));
  });
});

describe('Claiming Grants', () => {
  const earned = advance(withObjectives(politicalCity(), ['growth100', 'growth1000']), T0 + DAY).state;

  it('moves the Grants due into Urbs, by hand', () => {
    const due = earned.politics!.grantsDue;
    expect(due).toBeGreaterThan(0);
    const claimed = run(earned, { type: 'ClaimGrants' });
    expect(claimed.state.urbs).toBeCloseTo(earned.urbs + due, 5);
    expect(claimed.state.politics!.grantsDue).toBe(0);
    expect(claimed.events).toContainEqual({ type: 'GrantsClaimed', amount: due });
  });

  it('is refused when there is nothing to claim', () => {
    const result = dispatch(politicalCity(), { type: 'ClaimGrants' }, T0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.key).toBe('error.noGrants');
  });
});
