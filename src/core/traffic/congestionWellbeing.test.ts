import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from './walking';
import { CONGESTION, advance, congestionPenaltyOf, createBuilding, homeBenefits, newGame, type Building, type GameState } from '../index';
import { parseEnvelope, serializeEnvelope } from '../../persistence/envelope';

const walkingThreshold = WALKING.workThreshold;
beforeAll(() => {
  WALKING.workThreshold = 0;
});
afterAll(() => {
  WALKING.workThreshold = walkingThreshold;
});

const NOW = 1_700_000_000_000;
const start = newGame({ seed: 'traffic', now: NOW });
const base = { ...start, adaptationUntil: 0, buildings: start.buildings.map((building) => ({ ...building, tier: 8 })) };

function withHome(state: GameState, tier: number): { state: GameState; home: Building } {
  const home: Building = { ...createBuilding(state.nextId, 'home', 56, 59, 0), tier };
  return { state: { ...state, nextId: state.nextId + 1, buildings: [...state.buildings, home] }, home };
}

describe('congestionPenaltyOf', () => {
  it('is nil up to full load, then linear up to the cap', () => {
    expect(congestionPenaltyOf(0.5)).toBe(0);
    expect(congestionPenaltyOf(1)).toBe(0);
    expect(congestionPenaltyOf(1.5)).toBeCloseTo(CONGESTION.penaltyCap / 2);
    expect(congestionPenaltyOf(2)).toBe(CONGESTION.penaltyCap);
    expect(congestionPenaltyOf(9)).toBe(CONGESTION.penaltyCap);
  });
});

describe('Home Well-being under congestion', () => {
  it('has no congestion penalty when the road carries the Commuters', () => {
    const { state, home } = withHome(base, 1);
    expect(homeBenefits(state, home).congestionPenalty).toBe(0);
  });

  it('lowers Well-being once the bottleneck is overloaded, and upgrades relieve it', () => {
    const { state, home } = withHome(base, 7);
    const congested = homeBenefits(state, home);
    expect(congested.congestionPenalty).toBeGreaterThan(0);
    const upgraded = { ...state, roads: state.roads.map((road) => ({ ...road, tier: 3 })) };
    expect(homeBenefits(upgraded, home).congestionPenalty).toBeLessThan(congested.congestionPenalty);
  });

  it('applies the maximum penalty to a disconnected Home', () => {
    const { state, home } = withHome(base, 1);
    const isolated = { ...state, buildings: state.buildings.map((building) => (building === home ? { ...home, x: 20, y: 20 } : building)) };
    expect(homeBenefits(isolated, isolated.buildings.at(-1)!).congestionPenalty).toBe(CONGESTION.penaltyCap);
  });

  it('spares the penalty during an Adaptation period', () => {
    const { state, home } = withHome({ ...base, adaptationUntil: NOW + 1000, lastSeen: NOW }, 7);
    expect(homeBenefits(state, home).congestionPenalty).toBe(0);
  });

  it('keeps live ticks and catch-up consistent', () => {
    const { state } = withHome({ ...base, lastSeen: NOW }, 7);
    const hour = 3_600_000;
    const caughtUp = advance(state, NOW + 4 * hour).state;
    const stepped = [1, 2, 3, 4].reduce((current, step) => advance(current, NOW + step * hour).state, state);
    expect(stepped.urbs).toBeCloseTo(caughtUp.urbs);
    expect(stepped.buildings.map((b) => b.taxCitizenMs)).toEqual(caughtUp.buildings.map((b) => b.taxCitizenMs));
  });
});

describe('Road tier persistence', () => {
  it('round-trips an upgraded road', () => {
    const upgraded = { ...base, roads: base.roads.map((road, index) => (index === 0 ? { ...road, tier: 3 } : road)) };
    const loaded = parseEnvelope(serializeEnvelope(upgraded, NOW));
    expect(loaded.ok && loaded.state.roads[0]!.tier).toBe(3);
  });

  it('rejects an out-of-range road tier', () => {
    const broken = { ...base, roads: base.roads.map((road, index) => (index === 0 ? { ...road, tier: 9 } : road)) };
    expect(parseEnvelope(serializeEnvelope(broken, NOW)).ok).toBe(false);
  });
});
