import { t } from '../i18n/t';
import type { ArchitectMessageKey } from '../i18n/architect';
import type { Brick } from '../core/architect/housePlan.ts';
import { ARCHITECT_ROOF_COLORS, ARCHITECT_WALL_COLORS } from '../core/architect/architectTiers.ts';

export type Mode = 'footprint' | 'facade' | 'roof' | 'colors';
export const MODES: Mode[] = ['footprint', 'facade', 'roof', 'colors'];
export const MODE_LABEL: Record<Mode, string> = { footprint: t('architect.mode.footprint'), facade: t('architect.mode.facade'), roof: t('architect.mode.roof'), colors: t('architect.mode.colors') };

export type RoofTool = 'dormer' | 'chimney';
export const ROOF_TOOLS: RoofTool[] = ['dormer', 'chimney'];

export const BRICK_COLOR: Record<Brick, string> = {
  wall: '#d8c9a3',
  window: '#8fc8e8',
  bay: '#3f9ad0',
  door: '#6b4226',
  balcony: '#4a4a52',
  balconyDoor: '#2f2f38',
};
export const SECTION_COLORS = ['#e9b8a6', '#b9d7a8', '#a9c4e8', '#e8d9a0', '#d3b3e3', '#a8e0d6', '#f0c0d8', '#c8c8c8'];

export interface Swatch {
  name: string;
  color: string;
}

const swatch = (id: string, color: string): Swatch => ({ name: t(`architect.swatch.${id}` as ArchitectMessageKey), color });

// Colours of the game's palette (urbtopia and world styles); which of them an office Tier unlocks is decided in the core.
export const WALL_SWATCHES: Swatch[] = ARCHITECT_WALL_COLORS.map(({ id, color }) => swatch(id, color));

export const ROOF_SWATCHES: Swatch[] = ARCHITECT_ROOF_COLORS.map(({ id, color }) => swatch(id, color));
