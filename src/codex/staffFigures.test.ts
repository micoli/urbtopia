import { describe, expect, it } from 'vitest';
import { STAFF_ROLES, SUPERMARKET, STAFF } from '../core';
import { staffFigures } from './staffFigures';

describe('staffFigures', () => {
  it('describes every role with at least one effect and one Venue that hires it', () => {
    const figures = staffFigures();
    expect(figures.map(({ role }) => role)).toEqual([...STAFF_ROLES]);
    for (const { effects, venues } of figures) {
      expect(effects.length).toBeGreaterThan(0);
      expect(venues.length).toBeGreaterThan(0);
    }
  });

  it('reads the numbers of the stocker from the rules of the Supermarket', () => {
    const stocker = staffFigures().find(({ role }) => role === 'stocker')!;
    expect(stocker.effects[0]!.values).toEqual({
      units: String(SUPERMARKET.stockerUnitsPerPass),
      minutes: String(SUPERMARKET.stockerPassMinutes),
      perHour: String(SUPERMARKET.stockerUnitsPerPass * 60 / SUPERMARKET.stockerPassMinutes),
    });
  });

  it('reads the wage and the hire fee from the balance', () => {
    const cook = staffFigures().find(({ role }) => role === 'cook')!;
    expect(cook.dailyWage).toBe(STAFF.dailyWage.cook);
    expect(cook.hireFee).toBe(STAFF.dailyWage.cook * STAFF.hireFeeDays);
  });
});
