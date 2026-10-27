import { cycleHourOf, phaseOf, type DayPhase } from '../../core';

const ICONS: Record<DayPhase, string> = { dawn: '🌅', daytime: '☀️', dusk: '🌇', night: '🌙' };

export function cycleClockOf(cycleTime: number): { time: string; icon: string; phase: DayPhase } {
  const minutes = Math.floor(cycleHourOf(cycleTime) * 60);
  const phase = phaseOf(cycleTime);
  return { time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, icon: ICONS[phase], phase };
}
