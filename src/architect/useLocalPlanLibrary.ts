import { useState } from 'react';
import type { Plan } from '../core/architect/housePlan.ts';
import type { PlanLibrary } from './planLibrary.ts';

const STORAGE_KEY = 'architect-studio:plans';

function read(): Record<string, Plan> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, Plan>;
  } catch {
    return {};
  }
}

// The plans of the standalone page, kept in the browser storage.
export function useLocalPlanLibrary(): PlanLibrary {
  const [plans, setPlans] = useState(read);
  const keep = (next: Record<string, Plan>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPlans(next);
  };
  return {
    names: Object.keys(plans),
    load: (name) => plans[name],
    save: (name, plan) => keep({ ...read(), [name]: structuredClone(plan) }),
    remove: (name) => {
      const next = read();
      delete next[name];
      keep(next);
    },
  };
}
