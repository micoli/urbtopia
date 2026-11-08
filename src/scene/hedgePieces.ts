import hedges from '../../assets/defs/infrastructure/hedges.json' with { type: 'json' };
import { DIRECTIONS, neighbour, roadPiece, tileKey, type Coord, type Direction } from '../core';
import { modelFileOf } from '../core/models/modelFiles';

export const HEDGE_MODELS = Object.fromEntries(Object.entries(hedges).filter(([key]) => key !== '$schema').map(([piece, id]) => [piece, modelFileOf(id)])) as Record<'straight' | 'corner' | 't' | 'cross', string>;

const PIECE_MODELS = { square: 'straight', end: 'straight', straight: 'straight', crossing: 'straight', bend: 'corner', intersection: 't', crossroad: 'cross' } as const;

// A hedge joins its neighbouring hedges the way a road joins roads; a lone hedge or a hedge end is drawn straight.
export function hedgePiece(tile: Coord, isHedge: (key: string) => boolean): { model: string; rotation: number } {
  const exits = DIRECTIONS.filter((direction: Direction) => isHedge(tileKey(neighbour(tile, direction))));
  const { piece, rotation } = roadPiece(exits);
  return { model: HEDGE_MODELS[PIECE_MODELS[piece]], rotation };
}
