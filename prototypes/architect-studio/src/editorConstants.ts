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

export interface Swatch {
  name: string;
  color: string;
}

// Colours of the game's palette (urbtopia buildings and world styles).
export const WALL_SWATCHES: Swatch[] = [
  { name: 'Sable', color: '#e8d9b5' },
  { name: 'Blanc cassé', color: '#f1f1f6' },
  { name: 'Crème', color: '#fff1d6' },
  { name: 'Plâtre', color: '#efe4cc' },
  { name: 'Calcaire', color: '#bdb7a6' },
  { name: 'Pierre claire', color: '#d9d0bd' },
  { name: 'Brique jaune', color: '#d8b45c' },
  { name: 'Ocre', color: '#d9b878' },
  { name: 'Saumon', color: '#ff9c80' },
  { name: 'Rose poudré', color: '#d9a89a' },
  { name: 'Gris-bleu', color: '#8ea3bd' },
  { name: 'Gris', color: '#a4a9ad' },
  { name: 'Gris-vert', color: '#6f8f7c' },
  { name: 'Grès brun', color: '#8f5a43' },
];

export const ROOF_SWATCHES: Swatch[] = [
  { name: 'Terre cuite', color: '#b5533c' },
  { name: 'Brique', color: '#c2432e' },
  { name: 'Tuile', color: '#a85a3c' },
  { name: 'Argile', color: '#b5573a' },
  { name: 'Chaume', color: '#b99a58' },
  { name: 'Menthe', color: '#96ddbc' },
  { name: 'Gris-vert', color: '#6f8f7c' },
  { name: 'Gris clair', color: '#b4b8c8' },
  { name: 'Ardoise', color: '#6d7390' },
  { name: 'Ardoise bleue', color: '#46566e' },
  { name: 'Anthracite', color: '#54585f' },
  { name: 'Bardeau', color: '#5a4636' },
];
