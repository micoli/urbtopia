import type { Brick } from '../core/architect/housePlan.ts';

// The hole a brick leaves in the wall of its slot (1 wide, 1 high): the studio builds the wall around it, the model fills it.
// A model is at most 0.7 wide (the flat part of the wall at a convex corner).
export interface Opening {
  width: number;
  bottom: number;
  height: number;
  shape?: 'arch' | 'round'; // the model closes the opening with a round head or a circle: the wall fills the corners left by the rectangle
}

export const OPENINGS: Record<Exclude<Brick, 'wall'>, Opening> = {
  window: { width: 0.6, bottom: 0.35, height: 0.4 },
  windowArched: { width: 0.5, bottom: 0.3, height: 0.5, shape: 'arch' },
  windowShutters: { width: 0.4, bottom: 0.35, height: 0.4 },
  windowRound: { width: 0.4, bottom: 0.4, height: 0.4, shape: 'round' },
  bay: { width: 0.8, bottom: 0.15, height: 0.7 },
  door: { width: 0.6, bottom: 0, height: 0.75 },
  doorArched: { width: 0.6, bottom: 0, height: 0.8, shape: 'arch' },
  doorDouble: { width: 0.7, bottom: 0, height: 0.78 },
  doorGlazed: { width: 0.6, bottom: 0, height: 0.75 },
  doorGarage: { width: 0.7, bottom: 0, height: 0.6 },
  balcony: { width: 0.6, bottom: 0.35, height: 0.4 },
  balconyDoor: { width: 0.6, bottom: 0, height: 0.8 },
};

const CORNER_STEPS = 8;
const CORNER_OVERLAP = 0.01; // a corner reaches under the wall pieces around it: the pieces are cut and lowered by a seam

// The corners of the rectangular opening that lie outside the arch (two) or the circle (four), as outlines (x, y) in the slot.
export function cornerOutlines({ width, bottom, height, shape }: Opening): [number, number][][] {
  if (!shape) return [];
  const radius = width / 2;
  const centre = shape === 'arch' ? bottom + height - radius : bottom + height / 2;
  const reach = (value: number) => (Math.abs(value) >= radius - 1e-9 ? value + Math.sign(value) * CORNER_OVERLAP : value);
  const quarter = (sx: number, sy: number): [number, number][] =>
    [
      [0, sy * radius],
      [sx * radius, sy * radius],
      ...Array.from({ length: CORNER_STEPS + 1 }, (_, k) => {
        const angle = (Math.PI / 2) * (k / CORNER_STEPS);
        return [sx * radius * Math.cos(angle), sy * radius * Math.sin(angle)] as [number, number];
      }),
    ].map(([x, y]) => [reach(x!), centre + reach(y!)] as [number, number]);
  return shape === 'arch' ? [quarter(-1, 1), quarter(1, 1)] : [quarter(-1, 1), quarter(1, 1), quarter(-1, -1), quarter(1, -1)];
}
