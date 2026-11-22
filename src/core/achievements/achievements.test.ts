import { describe, expect, it } from 'vitest';
import { dispatch, newGame, type Command, type GameState } from '../index';
import { ACHIEVEMENTS, CATEGORY_NAMES } from './achievements';
import { latchAchievements } from './latch';
import { categoryProgress, visibleCategories } from './progress';

const NOW = 1_700_000_000_000;
const city = () => newGame({ seed: 'amber-fox-4821', now: NOW });

function applied(state: GameState, command: Command) {
  const result = dispatch(state, command, NOW);
  if (!result.ok) throw new Error(result.error.key);
  return result;
}

describe('Achievements', () => {
  it('has unique ids and a name for each category', () => {
    expect(new Set(ACHIEVEMENTS.map(({ id }) => id)).size).toBe(ACHIEVEMENTS.length);
    for (const { category } of ACHIEVEMENTS) expect(CATEGORY_NAMES[category]).toBeDefined();
  });

  it('latches an Achievement when its Command is applied, and announces it', () => {
    const result = applied(city(), { type: 'BuildPedestrianWay', from: { x: 55, y: 60 }, to: { x: 58, y: 60 } });
    expect(result.state.achievements).toContain('transport.pedestrianWay');
    expect(result.events).toContainEqual({ type: 'AchievementUnlocked', id: 'transport.pedestrianWay' });
  });

  it('does not earn an Achievement the City already had', () => {
    const first = applied(city(), { type: 'BuildPedestrianWay', from: { x: 55, y: 60 }, to: { x: 58, y: 60 } });
    const second = applied(first.state, { type: 'BuildPedestrianWay', from: { x: 55, y: 61 }, to: { x: 58, y: 61 } });
    expect(second.events.filter((event) => event.type === 'AchievementUnlocked')).toEqual([]);
  });

  it('never takes an Achievement back when the player demolishes what earned it', () => {
    const built = applied(city(), { type: 'BuildPedestrianWay', from: { x: 55, y: 60 }, to: { x: 58, y: 60 } });
    const razed = applied(built.state, { type: 'DemolishPedestrianWayPath', from: { x: 55, y: 60 }, to: { x: 58, y: 60 } });
    expect(razed.state.pedestrianWays ?? []).toHaveLength(0);
    expect(razed.state.achievements).toContain('transport.pedestrianWay');
  });

  it('earns nothing during a Replan', () => {
    const before = city();
    const after = { ...before, replan: { stash: { buildings: [] } }, busLines: [{ id: 99, stops: [] }] } as GameState;
    expect(latchAchievements(before, after, []).unlocked).toEqual([]);
  });

  it('counts a transit line only in its own mode', () => {
    const before = city();
    const after = { ...before, transitLines: [{ id: 1, stops: [], mode: 'rail' as const, peakHeadway: 1, offPeakHeadway: 1 }] };
    expect(latchAchievements(before, after, []).unlocked).toEqual(['transport.railwayLine']);
  });
});

describe('category progress', () => {
  it('counts the acquired Achievements of a category', () => {
    const state = { ...city(), achievements: ['transport.firstRoad', 'transport.bridge'] };
    expect(categoryProgress(state, 'transport')).toMatchObject({ acquired: 2, total: 7, complete: false });
  });

  it('is complete when every Achievement of the category is acquired', () => {
    const state = { ...city(), achievements: ACHIEVEMENTS.map(({ id }) => id) };
    expect(categoryProgress(state, 'transport').complete).toBe(true);
  });

  it('shows the categories that have Achievements', () => {
    expect(visibleCategories(city()).map(({ category }) => category)).toEqual(['production', 'housing', 'transport', 'interiors', 'energy', 'leisure', 'environment']);
  });
});

describe('Difficulty', () => {
  const politics = { ...ACHIEVEMENTS[0]!, fromDifficulty: 'easy' as const };

  it('rules out an Achievement the Difficulty does not have', async () => {
    const { isPossible } = await import('./progress');
    expect(isPossible({ ...city(), difficulty: 'cozy' }, politics)).toBe(false);
    expect(isPossible({ ...city(), difficulty: 'easy' }, politics)).toBe(true);
    expect(isPossible({ ...city(), difficulty: 'hard' }, politics)).toBe(true);
  });
});
