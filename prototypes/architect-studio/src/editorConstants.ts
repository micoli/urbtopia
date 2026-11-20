import type { Brick } from './model.ts';

export type Mode = 'footprint' | 'facade' | 'roof';
export const MODES: Mode[] = ['footprint', 'facade', 'roof'];
export const MODE_LABEL: Record<Mode, string> = { footprint: 'Emprise', facade: 'Façades', roof: 'Toits' };

export const BRICK_COLOR: Record<Brick, string> = {
  wall: '#d8c9a3',
  window: '#8fc8e8',
  bay: '#3f9ad0',
  door: '#6b4226',
  balcony: '#4a4a52',
  balconyDoor: '#2f2f38',
};
export const BRICK_SHORT: Record<Brick, string> = { wall: '', window: '▫', bay: '▭', door: '▮', balcony: '⌸', balconyDoor: '⌹' };
export const SECTION_COLORS = ['#e9b8a6', '#b9d7a8', '#a9c4e8', '#e8d9a0', '#d3b3e3', '#a8e0d6', '#f0c0d8', '#c8c8c8'];
