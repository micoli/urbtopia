import { DAY_CYCLE, cycleHourOf } from '../core';

// Which windows of the map are lit, and when. The shader runs the same hash on the GPU (see windowGlow.ts), so the
// constants and the integer operations here are the source of truth for both.
export const WINDOW_SCHEDULE = {
  usedShare: 0.6,
  nightStartHour: DAY_CYCLE.daytimeEnd,
  nightHours: 24 - (DAY_CYCLE.daytimeEnd - DAY_CYCLE.daytimeStart),
  latestOnHour: 2.5,
  earliestOffHour: 2.5,
  latestOffHour: 7.5,
  cellWidth: 0.5,
  cellHeight: 0.3,
};

export interface WindowCell {
  x: number;
  y: number;
  z: number;
}

const MULTIPLIERS = [73856093, 19349663, 83492791] as const;

function pcg(value: number): number {
  const state = (Math.imul(value, 747796405) + 2891336053) >>> 0;
  const word = (Math.imul((state >>> ((state >>> 28) + 4)) ^ state, 277803737)) >>> 0;
  return ((word >>> 22) ^ word) >>> 0;
}

export function windowHash(cell: WindowCell, nightIndex: number): number {
  let hash = nightIndex >>> 0;
  hash = pcg((hash ^ Math.imul(cell.x, MULTIPLIERS[0])) >>> 0);
  hash = pcg((hash ^ Math.imul(cell.y, MULTIPLIERS[1])) >>> 0);
  return pcg((hash ^ Math.imul(cell.z, MULTIPLIERS[2])) >>> 0);
}

export function cellOf(x: number, y: number, z: number): WindowCell {
  return { x: Math.floor(x / WINDOW_SCHEDULE.cellWidth), y: Math.floor(y / WINDOW_SCHEDULE.cellHeight), z: Math.floor(z / WINDOW_SCHEDULE.cellWidth) };
}

export interface NightClock {
  // Cycle hours since 22:00, or -1 in Daytime and at dawn.
  sinceDusk: number;
  // The same number all night long, a new one every Night.
  nightIndex: number;
}

export function nightClockOf(cycleTime: number): NightClock {
  const dusk = WINDOW_SCHEDULE.nightStartHour;
  const sinceDusk = (((cycleHourOf(cycleTime) - dusk) % 24) + 24) % 24;
  const nightIndex = Math.floor((cycleTime - dusk * (DAY_CYCLE.durationMs / 24)) / DAY_CYCLE.durationMs);
  return { sinceDusk: sinceDusk < WINDOW_SCHEDULE.nightHours ? sinceDusk : -1, nightIndex };
}

const byte = (hash: number, shift: number): number => ((hash >>> shift) & 0xff) / 255;

export function windowLitAt(cell: WindowCell, clock: NightClock): boolean {
  if (clock.sinceDusk < 0) return false;
  const hash = windowHash(cell, clock.nightIndex);
  if (byte(hash, 0) >= WINDOW_SCHEDULE.usedShare) return false;
  const on = byte(hash, 8) * WINDOW_SCHEDULE.latestOnHour;
  const off = WINDOW_SCHEDULE.earliestOffHour + byte(hash, 16) * (WINDOW_SCHEDULE.latestOffHour - WINDOW_SCHEDULE.earliestOffHour);
  return clock.sinceDusk >= on && clock.sinceDusk < off;
}
