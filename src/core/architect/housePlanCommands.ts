import type { CommandOutcome } from '../engine/commands';
import type { GameState } from '../engine/state';
import { architectTierOf, isPlanUnlockedAt, planLimitOf } from './architectTiers';
import { planFitsType } from './houseDesign';
import { planFrom, type Plan } from './housePlan';

export const HOUSE_PLAN_NAME_MAX_LENGTH = 40;

// A plan the player drew in an Architect office, saved with the city.
export interface SavedHousePlan {
  readonly id: number;
  readonly name: string;
  readonly plan: Plan;
}

export const housePlansOf = (state: Pick<GameState, 'housePlans'>): readonly SavedHousePlan[] => state.housePlans ?? [];

const isValidName = (name: string): boolean => name.trim().length > 0 && name.length <= HOUSE_PLAN_NAME_MAX_LENGTH;

// Saves a plan under a name: a plan of the same name is replaced, any other name adds one.
export function saveHousePlan(state: GameState, name: string, plan: Plan): CommandOutcome {
  const valid = planFrom(plan);
  const trimmed = name.trim();
  if ('error' in valid || !isValidName(trimmed)) return { key: 'error.invalidHousePlan' };
  const tier = architectTierOf(state);
  if (!isPlanUnlockedAt(valid, tier)) return { key: 'error.housePlanLocked' };
  const plans = housePlansOf(state);
  const existing = plans.find((saved) => saved.name === trimmed);
  if (!existing && plans.length >= planLimitOf(tier)) return { key: 'error.housePlanLimit' };
  const saved: SavedHousePlan = { id: existing?.id ?? Math.max(0, ...plans.map((candidate) => candidate.id)) + 1, name: trimmed, plan: structuredClone(valid) };
  const housePlans = existing ? plans.map((candidate) => (candidate === existing ? saved : candidate)) : [...plans, saved];
  if (!existing) return { state: { ...state, housePlans }, events: [] };
  const built = state.buildings.filter((building) => building.design?.planId === saved.id);
  if (built.some((building) => !planFitsType(building.type, saved.plan))) return { key: 'error.housePlanFootprintInUse' };
  const buildings = state.buildings.map((building) => (building.design?.planId === saved.id ? { ...building, design: { name: saved.name, plan: structuredClone(saved.plan), planId: saved.id } } : building));
  return { state: { ...state, housePlans, buildings }, events: [] };
}

export function deleteHousePlan(state: GameState, id: number): CommandOutcome {
  const plans = housePlansOf(state);
  if (!plans.some((saved) => saved.id === id)) return { key: 'error.unknownHousePlan' };
  const buildings = state.buildings.map((building) => {
    if (building.design?.planId !== id) return building;
    const { planId: _detached, ...design } = building.design;
    return { ...building, design };
  });
  return { state: { ...state, housePlans: plans.filter((saved) => saved.id !== id), buildings }, events: [] };
}
