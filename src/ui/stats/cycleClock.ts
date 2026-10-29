import { cycleHourOf, phaseOf, type DayPhase } from '../../core';
import type { IconName } from '../common/iconRegistry';

const ICONS: Record<DayPhase, IconName> = { dawn: 'dawn', daytime: 'day', dusk: 'dusk', night: 'night' };

export function cycleClockOf(cycleTime: number): { time: string; icon: IconName; phase: DayPhase } {
  const minutes = Math.floor(cycleHourOf(cycleTime) * 60);
  const phase = phaseOf(cycleTime);
  return { time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, icon: ICONS[phase], phase };
}
