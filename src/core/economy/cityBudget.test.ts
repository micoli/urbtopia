import { describe, expect, it } from 'vitest';
import { BUDGET_HOURS, cityBudget, congestionStats, createBuilding, energyStats, cityTransportStats, newGame, TAX } from '../index';

function budgetOf(state: ReturnType<typeof newGame>) {
  return cityBudget(state, { energy: energyStats(state), congestion: congestionStats(state), transport: cityTransportStats(state) });
}

describe('city budget over 24 hours', () => {
  it('is empty for a city with no building', () => {
    const budget = budgetOf({ ...newGame({ seed: 'budget', now: 0 }), buildings: [] });
    expect(budget.revenues.total).toBe(0);
    expect(budget.expenses.total).toBe(0);
    expect(budget.net).toBe(0);
  });

  it('counts the Tax of a Home over 24 hours', () => {
    const state = { ...newGame({ seed: 'budget', now: 0 }), buildings: [createBuilding(1, 'home', 55, 57, 0)] };
    const budget = budgetOf(state);
    expect(budget.revenues.tax).toBeGreaterThan(0);
    expect(budget.revenues.tax).toBeLessThanOrEqual(BUDGET_HOURS * TAX.urbsPerCitizenPerHour * 100);
    expect(budget.net).toBe(budget.revenues.total - budget.expenses.total);
  });
});
