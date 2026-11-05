import { describe, expect, it } from 'vitest';
import { ANNUAL_EVENT_ENTRIES, DAYS_AFTER_ANNUAL_EVENT } from '../core/annualEvents/annualEvents';
import { newGame } from '../core';
import { annualEventsFigures } from './annualEventsFigures';

const on = (iso: string) => ({ ...newGame({ seed: 'annual-events-figures', now: Date.parse(`${iso}T12:00:00`) }), lastSeen: Date.parse(`${iso}T12:00:00`) });

describe('annualEventsFigures', () => {
  it('lists every Annual event once, soonest first', () => {
    const figures = annualEventsFigures(on('2026-06-01'));
    expect(figures.map(({ id }) => id).sort()).toEqual(ANNUAL_EVENT_ENTRIES.map(({ id }) => id).sort());
    expect(figures.map(({ window }) => window.startDay)).toEqual([...figures.map(({ window }) => window.startDay)].sort((a, b) => a - b));
  });

  it('opens an event on the day its window starts and counts the days before', () => {
    const [first] = annualEventsFigures(on('2026-06-01'));
    expect(first!.status).toBe('open');
    const upcoming = annualEventsFigures(on('2026-06-01')).find(({ status }) => status === 'upcoming')!;
    expect(upcoming.daysUntilOpen).toBeGreaterThan(0);
  });

  it('moves on to the next year once a window is over', () => {
    const halloween = (iso: string) => annualEventsFigures(on(iso)).find(({ id }) => id === 'halloween')!;
    const inside = halloween('2026-10-31');
    const after = halloween(new Date(Date.UTC(2026, 10, 1) + DAYS_AFTER_ANNUAL_EVENT * 86_400_000 + 86_400_000).toISOString().slice(0, 10));
    expect(inside.status).toBe('open');
    expect(after.window.startDay).toBeGreaterThan(inside.window.endDay);
  });
});
