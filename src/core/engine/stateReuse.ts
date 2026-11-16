import type { GameState } from './state';

type Fields = Record<string, unknown>;

// True when every field but the ignored ones is the same value (by reference for objects).
export function sameFieldsExcept(a: object, b: object, ignored: readonly string[]): boolean {
  const left = a as Fields, right = b as Fields;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of ignored) keys.delete(key);
  for (const key of keys) if (left[key] !== right[key]) return false;
  return true;
}

export const hasCoal = (state: GameState): boolean => (state.storage.materials.coal ?? 0) > 1e-9;

export const gameHourOf = (state: Pick<GameState, 'timeOffset'>, now: number, hourMs: number): number => Math.floor((now + (state.timeOffset ?? 0)) / hourMs);

// What a replay step changes without touching the power or the transit: the clock, the budget and the stock. Only whether there is money and coal matters to them.
export const STEP_FIELDS = ['buildings', 'lastSeen', 'urbs', 'storage'] as const;

export function sameStepInputs(previous: GameState, next: GameState): boolean {
  return previous.urbs > 1e-9 === next.urbs > 1e-9 && hasCoal(previous) === hasCoal(next) && sameFieldsExcept(previous, next, STEP_FIELDS);
}
