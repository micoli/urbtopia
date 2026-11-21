import { HOUSE_PLAN_NAME_MAX_LENGTH } from '../core/architect/housePlanCommands';
import { isDesignWithinType } from '../core/architect/houseDesign';
import { planFrom } from '../core/architect/housePlan';

const isSavedPlan = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false;
  const { id, name, plan } = value as Record<string, unknown>;
  return Number.isInteger(id) && (id as number) >= 1 && typeof name === 'string' && name.trim() !== '' && name.length <= HOUSE_PLAN_NAME_MAX_LENGTH && !('error' in planFrom(plan));
};

// The plans of the city: distinct ids and names, each plan a valid house plan.
export const isHousePlanList = (value: unknown): boolean => {
  if (!Array.isArray(value) || !value.every(isSavedPlan)) return false;
  const plans = value as { id: number; name: string }[];
  return new Set(plans.map((plan) => plan.id)).size === plans.length && new Set(plans.map((plan) => plan.name)).size === plans.length;
};

// The design of a Home built from a plan: a named plan that fits the footprint of the Home type.
export const isDesignOf = (type: string, value: unknown): boolean => typeof value === 'object' && value !== null && isDesignWithinType(type, value as { name: string; plan: never });
