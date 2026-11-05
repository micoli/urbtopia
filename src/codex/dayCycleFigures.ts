import { DAY_CYCLE, ECOLOGY, cycleHourOf, cycleTimeOf, phaseOf, productionFactors, timeOfCycleHour, type DayPhase, type GameState } from '../core';

export interface DayCycleHour {
  hour: number;
  phase: DayPhase;
  solar: number;
  hydro: number;
}

export interface DayCycleFigures {
  durationHours: number;
  cycleHours: number;
  cycleHourMinutes: number;
  daytimeStart: number;
  daytimeEnd: number;
  daytimeHours: number;
  nightHours: number;
  fadeHours: number;
  hydroMinFactor: number;
  current: { hour: number; phase: DayPhase };
  hours: readonly DayCycleHour[];
}

const MINUTES_PER_HOUR = 60;

// `current` follows the clock of the city, so a prerendered page shows the same moment as the page it hydrates.
export function dayCycleFigures(state: GameState): DayCycleFigures {
  const { durationMs, cycleHours, daytimeStart, daytimeEnd, fadeHours } = DAY_CYCLE;
  const cycleTime = cycleTimeOf(state, state.lastSeen);
  return {
    durationHours: durationMs / ECOLOGY.hourMs,
    cycleHours,
    cycleHourMinutes: durationMs / cycleHours / ECOLOGY.hourMs * MINUTES_PER_HOUR,
    daytimeStart,
    daytimeEnd,
    daytimeHours: daytimeEnd - daytimeStart,
    nightHours: cycleHours - (daytimeEnd - daytimeStart),
    fadeHours,
    hydroMinFactor: ECOLOGY.hydroMinFactor,
    current: { hour: Math.floor(cycleHourOf(cycleTime)), phase: phaseOf(cycleTime) },
    hours: Array.from({ length: cycleHours }, (_, hour) => {
      const time = timeOfCycleHour(hour);
      const { solar, hydro } = productionFactors(0, time);
      return { hour, phase: phaseOf(time), solar, hydro };
    }),
  };
}
