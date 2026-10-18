import type { TransitMode } from '../../../../core';
import type { LoadLevel } from './transportMapModel.ts';

const LINE_COLORS = ['#4dabf7', '#ff922b', '#51cf66', '#f06595', '#cc5de8', '#fcc419', '#22b8cf', '#ff6b6b'] as const;

export const lineColor = (id: number): string => LINE_COLORS[id % LINE_COLORS.length]!;

export const LEVEL_COLORS: Record<LoadLevel, string> = { free: '#69db7c', loaded: '#ffa94d', saturated: '#ff6b6b' };

export const INACTIVE_COLOR = '#868e96';

// Stroke widths in pixels: they do not scale with the zoom, and the load adds up to LOAD_WIDTH.
export const BASE_WIDTH: Record<TransitMode, number> = { bus: 2, rail: 3, brt: 4 };
export const LOAD_WIDTH = 5;
