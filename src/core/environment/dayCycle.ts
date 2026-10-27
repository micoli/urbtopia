import type { GameState } from '../engine/state';

const HOUR_MS = 3_600_000;

export const DAY_CYCLE = {
  durationMs: 2 * HOUR_MS,
  cycleHours: 24,
  daytimeStart: 6,
  daytimeEnd: 22,
  fadeHours: 1,
  startHour: 6,
};

const CYCLE_HOUR_MS = DAY_CYCLE.durationMs / DAY_CYCLE.cycleHours;

export type DayPhase = 'dawn' | 'daytime' | 'dusk' | 'night';

// Cycle hour in [0, 24), fractional.
export function cycleHourOf(time: number): number {
  const sinceStart = ((time % DAY_CYCLE.durationMs) + DAY_CYCLE.durationMs) % DAY_CYCLE.durationMs;
  return sinceStart / CYCLE_HOUR_MS;
}

export function isDaytime(time: number): boolean {
  const hour = cycleHourOf(time);
  return hour >= DAY_CYCLE.daytimeStart && hour < DAY_CYCLE.daytimeEnd;
}

// Dawn and dusk are fades that fall within the Night, right before and right after Daytime.
export function phaseOf(time: number): DayPhase {
  const hour = cycleHourOf(time);
  if (isDaytime(time)) return 'daytime';
  if (hour >= DAY_CYCLE.daytimeStart - DAY_CYCLE.fadeHours && hour < DAY_CYCLE.daytimeStart) return 'dawn';
  if (hour >= DAY_CYCLE.daytimeEnd && hour < DAY_CYCLE.daytimeEnd + DAY_CYCLE.fadeHours) return 'dusk';
  return 'night';
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

// Light level in [0, 1]: 1 in Daytime, 0 in full Night, smooth through dawn and dusk.
export function daylightOf(time: number): number {
  const hour = cycleHourOf(time);
  const phase = phaseOf(time);
  if (phase === 'daytime') return 1;
  if (phase === 'dawn') return smooth((hour - (DAY_CYCLE.daytimeStart - DAY_CYCLE.fadeHours)) / DAY_CYCLE.fadeHours);
  if (phase === 'dusk') return smooth(1 - (hour - DAY_CYCLE.daytimeEnd) / DAY_CYCLE.fadeHours);
  return 0;
}

// The Day cycle follows the game clock, so a Time skip moves it. `dayCycleOffset` only sets where a City starts.
export function cycleTimeOf(state: Pick<GameState, 'timeOffset' | 'dayCycleOffset'>, now: number): number {
  return now + (state.timeOffset ?? 0) + (state.dayCycleOffset ?? 0);
}

// Offset that puts the Day cycle at its start hour at `now`.
export function dayCycleOffsetAt(now: number): number {
  const target = DAY_CYCLE.startHour * CYCLE_HOUR_MS;
  const current = ((now % DAY_CYCLE.durationMs) + DAY_CYCLE.durationMs) % DAY_CYCLE.durationMs;
  return ((target - current) % DAY_CYCLE.durationMs + DAY_CYCLE.durationMs) % DAY_CYCLE.durationMs;
}
