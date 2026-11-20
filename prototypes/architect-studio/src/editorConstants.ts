import { t } from './i18n.ts';
import type { ArchitectMessageKey } from './messages.ts';
import type { Brick } from './model.ts';

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

// Colours of the game's palette (urbtopia and world styles).
export const WALL_SWATCHES: Swatch[] = [
  swatch('sand', '#e8d9b5'),
  swatch('offwhite', '#f1f1f6'),
  swatch('cream', '#fff1d6'),
  swatch('plaster', '#efe4cc'),
  swatch('limestone', '#bdb7a6'),
  swatch('stone', '#d9d0bd'),
  swatch('yellowbrick', '#d8b45c'),
  swatch('ochre', '#d9b878'),
  swatch('salmon', '#ff9c80'),
  swatch('dustypink', '#d9a89a'),
  swatch('bluegrey', '#8ea3bd'),
  swatch('grey', '#a4a9ad'),
  swatch('greygreen', '#6f8f7c'),
  swatch('brownstone', '#8f5a43'),
];

export const ROOF_SWATCHES: Swatch[] = [
  swatch('terracotta', '#b5533c'),
  swatch('brick', '#c2432e'),
  swatch('tile', '#a85a3c'),
  swatch('clay', '#b5573a'),
  swatch('thatch', '#b99a58'),
  swatch('mint', '#96ddbc'),
  swatch('greygreen', '#6f8f7c'),
  swatch('lightgrey', '#b4b8c8'),
  swatch('slate', '#6d7390'),
  swatch('slateblue', '#46566e'),
  swatch('anthracite', '#54585f'),
  swatch('shingle', '#5a4636'),
];
