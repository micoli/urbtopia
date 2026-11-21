import { useCallback, useReducer } from 'react';
import type { Plan } from '../core/architect/housePlan.ts';

const LIMIT = 100;

interface History {
  past: Plan[];
  present: Plan;
  future: Plan[];
}

type Action = { type: 'edit'; mutate: (plan: Plan) => void; allow?: (next: Plan, present: Plan) => boolean } | { type: 'replace'; plan: Plan } | { type: 'reset'; plan: Plan } | { type: 'undo' } | { type: 'redo' };

function commit(state: History, next: Plan): History {
  if (JSON.stringify(next) === JSON.stringify(state.present)) return state;
  return { past: [...state.past, state.present].slice(-LIMIT), present: next, future: [] };
}

function reducer(state: History, action: Action): History {
  if (action.type === 'edit') {
    const next = structuredClone(state.present);
    action.mutate(next);
    if (action.allow && !action.allow(next, state.present)) return state;
    return commit(state, next);
  }
  if (action.type === 'replace') return commit(state, action.plan);
  if (action.type === 'reset') return { past: [], present: action.plan, future: [] };
  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
  }
  const [next, ...future] = state.future;
  if (!next) return state;
  return { past: [...state.past, state.present], present: next, future };
}

// `allow` can refuse an edit by looking at the plan it would give.
export function usePlanHistory(initial: () => Plan, allow?: (next: Plan, present: Plan) => boolean) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ past: [], present: initial(), future: [] }));
  return {
    plan: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    edit: useCallback((mutate: (plan: Plan) => void) => dispatch({ type: 'edit', mutate, allow }), [allow]),
    replace: useCallback((plan: Plan) => dispatch({ type: 'replace', plan }), []),
    reset: useCallback((plan: Plan) => dispatch({ type: 'reset', plan }), []),
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
    redo: useCallback(() => dispatch({ type: 'redo' }), []),
  };
}
