import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { handleCommand } from '../core/engine/commands';
import { newPlan } from '../core/architect/housePlan';
import { CURRENT_VERSION, parseEnvelope, serializeEnvelope } from './envelope';

const state = () => newGame({ seed: 'house-plans', now: 0 });

describe('house plans in the save', () => {
  it('round-trips the plans of the city', () => {
    const saved = handleCommand(state(), { type: 'SaveHousePlan', name: 'Villa', plan: newPlan('L') }, 0);
    if ('key' in saved) throw new Error(saved.key);
    const loaded = parseEnvelope(serializeEnvelope(saved.state, 1));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.housePlans).toEqual(saved.state.housePlans);
    expect(JSON.parse(serializeEnvelope(saved.state, 1)).version).toBe(CURRENT_VERSION);
  });

  it('refuses a save whose plans are invalid or share a name', () => {
    const plan = newPlan('rect');
    const twice = { ...state(), housePlans: [{ id: 1, name: 'A', plan }, { id: 2, name: 'A', plan }] };
    expect(parseEnvelope(serializeEnvelope(twice, 1)).ok).toBe(false);
    const broken = { ...state(), housePlans: [{ id: 1, name: 'A', plan: { ...plan, floors: [] } }] };
    expect(parseEnvelope(serializeEnvelope(broken, 1)).ok).toBe(false);
  });

  it('loads a city saved before the plans existed with no plan', () => {
    const loaded = parseEnvelope(JSON.stringify({ ...JSON.parse(JSON.stringify({ format: 'urbtopia-save', version: 20, savedAt: 0, state: state() })) }));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.housePlans).toBeUndefined();
  });
});

describe('the commands on house plans', () => {
  it('saves a plan, replaces the plan of the same name and deletes a plan', () => {
    const first = handleCommand(state(), { type: 'SaveHousePlan', name: ' Villa ', plan: newPlan('rect') }, 0);
    if ('key' in first) throw new Error(first.key);
    const second = handleCommand(first.state, { type: 'SaveHousePlan', name: 'Villa', plan: newPlan('U') }, 0);
    if ('key' in second) throw new Error(second.key);
    expect(second.state.housePlans).toHaveLength(1);
    expect(second.state.housePlans?.[0]).toMatchObject({ id: 1, name: 'Villa' });
    const other = handleCommand(second.state, { type: 'SaveHousePlan', name: 'Loft', plan: newPlan('T') }, 0);
    if ('key' in other) throw new Error(other.key);
    expect(other.state.housePlans?.map((plan) => plan.id)).toEqual([1, 2]);
    const removed = handleCommand(other.state, { type: 'DeleteHousePlan', id: 1 }, 0);
    if ('key' in removed) throw new Error(removed.key);
    expect(removed.state.housePlans?.map((plan) => plan.name)).toEqual(['Loft']);
  });

  it('refuses a nameless plan, an empty plan and an unknown plan', () => {
    expect(handleCommand(state(), { type: 'SaveHousePlan', name: '  ', plan: newPlan('rect') }, 0)).toMatchObject({ key: 'error.invalidHousePlan' });
    const empty = { ...newPlan('rect'), floors: [[[false]]] };
    expect(handleCommand(state(), { type: 'SaveHousePlan', name: 'A', plan: empty }, 0)).toMatchObject({ key: 'error.invalidHousePlan' });
    expect(handleCommand(state(), { type: 'DeleteHousePlan', id: 9 }, 0)).toMatchObject({ key: 'error.unknownHousePlan' });
  });
});
