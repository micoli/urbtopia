import type { Plan } from '../core/architect/housePlan';

export const HOUSE_PLAN_MODEL = 'procedural/house-plan';

const plans = new Map<string, Plan>();

const hashOf = (text: string): string => {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
};

// The key of the model of a house plan: equal plans share one model, which the library builds from the plan registered here.
export function houseModelKeyOf(plan: Plan): string {
  const key = `${HOUSE_PLAN_MODEL}:${hashOf(JSON.stringify(plan))}`;
  if (!plans.has(key)) plans.set(key, plan);
  return key;
}

export const isHouseModel = (key: string): boolean => key.startsWith(`${HOUSE_PLAN_MODEL}:`);

export const planOfHouseModel = (key: string): Plan | undefined => plans.get(key);
