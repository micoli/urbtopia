import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, homeBenefits, needsPyramid, newGame, SOLIDARITY, type GameState } from '../index';
import { parseEnvelope, serializeEnvelope } from '../../persistence/envelope';
import { donationQuote, solidarityCost } from './solidarity';

const NOW = 1_700_000_000_000;
const HOUR = 3_600_000;
const ID = '1a000000-0000-4000-8000-000000000001';

function city(): GameState {
  return {
    ...newGame({ seed: 'solidarity', now: NOW }),
    buildings: [createBuilding(1, 'home', 55, 55, 0)],
    nextId: 2,
    marketUnlocked: true,
    storage: { materials: { wood: 10 }, goods: { tools: 10, planks: 10 } },
  };
}

describe('charitable donations', () => {
  it('consumes Goods without paying Urbs or changing Market prices, and survives a save round trip', () => {
    const before = city();
    const result = dispatch(before, { type: 'DonateGoods', id: ID, good: 'tools', quantity: 2 }, NOW);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.storage.goods.tools).toBe(8);
    expect(result.state.storage.materials).toEqual(before.storage.materials);
    expect(result.state.urbs).toBe(before.urbs);
    expect(result.state.market).toEqual(before.market);
    expect(result.state.donations).toEqual([{ id: ID, value: 160 }]);
    expect(result.state.solidarityMs).toBeCloseTo(19.2 * HOUR);
    const loaded = parseEnvelope(serializeEnvelope(result.state, NOW));
    expect(loaded.ok && loaded.state.solidarityMs).toBe(result.state.solidarityMs);
    expect(loaded.ok && loaded.state.donations).toEqual(result.state.donations);
    expect(parseEnvelope(serializeEnvelope(before, NOW)).ok).toBe(true);
  });

  it('rejects invalid quantities, Materials, insufficient stock, and a locked Market', () => {
    for (const quantity of [0, -1, 1.5, Infinity, 11]) {
      expect(dispatch(city(), { type: 'DonateGoods', id: ID, good: 'tools', quantity }, NOW).ok).toBe(false);
    }
    expect(dispatch(city(), { type: 'DonateGoods', id: ID, good: 'wood' as 'tools', quantity: 1 }, NOW).ok).toBe(false);
    expect(dispatch({ ...city(), marketUnlocked: false }, { type: 'DonateGoods', id: ID, good: 'tools', quantity: 1 }, NOW).ok).toBe(false);
  });

  it('counts a full Donation towards the Medal even when the reserve is full', () => {
    const before = { ...city(), solidarityMs: SOLIDARITY.durationMs };
    const quote = donationQuote(before, 'tools', 2);
    expect(quote).toMatchObject({ value: 160, addedMs: 0, excessValue: 160 });
    const result = dispatch(before, { type: 'DonateGoods', id: ID, good: 'tools', quantity: 2 }, NOW);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.solidarityMs).toBe(SOLIDARITY.durationMs);
    expect(result.state.donations?.[0]?.value).toBe(160);
    expect(homeBenefits(result.state, result.state.buildings[0]!).solidarityBonus).toBe(5);
  });

  it('prices new duration against current population without repricing previously acquired time', () => {
    const small = { ...city(), buildings: [{ ...city().buildings[0]!, tier: 5 }], solidarityMs: 6 * HOUR };
    const large = { ...small, buildings: Array.from({ length: 10 }, (_, index) => ({ ...small.buildings[0]!, id: index + 1 })) };
    expect(solidarityCost(small)).toBe(200);
    expect(solidarityCost(large)).toBe(2000);
    expect(donationQuote(small, 'planks', 1).addedMs).toBeCloseTo(1.68 * HOUR);
    expect(donationQuote(large, 'planks', 1).addedMs).toBeCloseTo(0.168 * HOUR);
    expect(large.solidarityMs).toBe(6 * HOUR);
  });

  it('stops the Tax benefit at a non-hour expiry during catch-up and Time skips', () => {
    const before = city();
    const duration = 37 * 60_000;
    const donated = { ...before, solidarityMs: duration };
    const baseline = advance(before, NOW + 2 * HOUR).state;
    const caught = advance(donated, NOW + 2 * HOUR).state;
    const untilExpiry = advance(donated, NOW + duration).state;
    const split = advance(untilExpiry, NOW + 2 * HOUR).state;
    const extraTaxCitizenMs = 6 * duration * 0.01;
    expect(caught.buildings[0]!.taxCitizenMs - baseline.buildings[0]!.taxCitizenMs).toBeCloseTo(extraTaxCitizenMs, 3);
    expect(split.buildings[0]!.taxCitizenMs).toBeCloseTo(caught.buildings[0]!.taxCitizenMs, 3);
    expect(caught.solidarityMs).toBe(0);
    expect(homeBenefits(caught, caught.buildings[0]!).solidarityBonus).toBe(0);
    const skipped = dispatch(donated, { type: 'SkipTime', hours: 2 }, NOW);
    expect(skipped.ok && skipped.state.solidarityMs).toBe(0);
    expect(skipped.ok && skipped.state.buildings[0]!.taxCitizenMs).toBeCloseTo(caught.buildings[0]!.taxCitizenMs, 3);
    expect(advance(donated, NOW + 72 * HOUR).state.solidarityMs).toBe(0);
  });

  it('keeps an inactive Solidarity factor outside the needs average and bottleneck', () => {
    const before = city();
    const pyramid = needsPyramid(before);
    const belonging = pyramid.levels.find(level => level.id === 'belonging')!;
    const existing = belonging.factors.filter(factor => !factor.optional && factor.satisfaction !== null);
    const average = existing.reduce((sum, factor) => sum + factor.satisfaction!, 0) / existing.length;
    expect(belonging.satisfaction).toBeCloseTo(average);
    expect(pyramid.bottleneck?.id).not.toBe('solidarity');
    const active = needsPyramid({ ...before, solidarityMs: HOUR }).levels.find(level => level.id === 'belonging')!;
    expect(active.satisfaction).toBe(Math.min(100, average + 5));
    expect(active.factors.find(factor => factor.id === 'solidarity')?.effects).not.toContain('sanction');
  });
});
