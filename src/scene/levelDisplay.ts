import { SURFACE, type Level } from '../core';

export type SurfaceDisplay = 'full' | 'ghost' | 'hidden';

// On an underground Level the Surface is a flat translucent silhouette; a device that cannot keep the frame budget hides it instead.
export function surfaceDisplayOf(level: Level, slowDevice: boolean): SurfaceDisplay {
  if (level === SURFACE) return 'full';
  return slowDevice ? 'hidden' : 'ghost';
}

export const LEVEL_FLOOR_COLORS: Readonly<Record<Exclude<Level, 0>, number>> = {
  '-1': 0x8a7b68,
  '-2': 0x5e5448,
};
