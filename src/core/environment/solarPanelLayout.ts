import type { SolarPanelDefinition } from '../buildings/solarPanelsSchema';

export interface PanelPlacement {
  // The default roof panel when unset.
  model?: string;
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

// Where the panels sit, as offsets from the center of the footprint: the ones the definition lists, else a flat panel at the center of each tile.
export function solarPanelPlacements(width: number, depth: number, panels?: readonly SolarPanelDefinition[]): PanelPlacement[] {
  if (panels?.length) return panels.map(({ model, x = 0, y = 0, z = 0, rotationX = 0, rotationY = 0, rotationZ = 0 }) => ({ model, x, y, z, rotationX, rotationY, rotationZ }));
  return Array.from({ length: width * depth }, (_, index) => ({ x: (index % width) + 0.5 - width / 2, y: 0, z: Math.floor(index / width) + 0.5 - depth / 2, rotationX: 0, rotationY: 0, rotationZ: 0 }));
}

// The offset turned by quarter turns about the vertical axis, as the scene turns a building.
export function turnedOffset(x: number, z: number, quarterTurns: number): { x: number; z: number } {
  const angle = (quarterTurns * Math.PI) / 2;
  const cos = Math.round(Math.cos(angle)), sin = Math.round(Math.sin(angle));
  return { x: x * cos + z * sin, z: z * cos - x * sin };
}
