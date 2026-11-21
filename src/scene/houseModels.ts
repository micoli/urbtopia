import type { Plan } from '../core/architect/housePlan';

export const HOUSE_PLAN_MODEL = 'procedural/house-plan';

const plans = new Map<string, Plan>();
const jsonByKey = new Map<string, string>();
const keyByPlan = new WeakMap<Plan, string>();

const hashOf = (text: string): string => {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
};

// The key of the model of a house plan: equal plans share one model, which the library builds from the plan registered here.
// A key is worked out once per plan object, and two different plans never get the same key.
export function houseModelKeyOf(plan: Plan): string {
  const known = keyByPlan.get(plan);
  if (known) return known;
  const json = JSON.stringify(plan);
  const base = `${HOUSE_PLAN_MODEL}:${hashOf(json)}`;
  let key = base;
  for (let attempt = 1; jsonByKey.has(key) && jsonByKey.get(key) !== json; attempt++) key = `${base}-${attempt}`;
  if (!plans.has(key)) {
    plans.set(key, plan);
    jsonByKey.set(key, json);
  }
  keyByPlan.set(plan, key);
  return key;
}

export const isHouseModel = (key: string): boolean => key.startsWith(`${HOUSE_PLAN_MODEL}:`);

export const planOfHouseModel = (key: string): Plan | undefined => plans.get(key);
