import { deckOf, deckSizeOf } from './districtDeck';
import { isPlacementValid } from './districtPlacement';
import { scoreOf, type PlacedHex } from './districtScore';
import { DISTRICT_PLAN } from './districtPlanBalance';
import { rotateHex, type Hex } from './hex';
import { CENTRE, EDGE_COUNT, type Cell } from './hexGrid';

// A Hex of the Deck is placed in the order it is drawn, so a game is its Deck plus the cell and the rotation of each placement; the first is the Start hex.
export interface Placement {
  readonly cell: Cell;
  readonly rotation: number;
}

export interface DistrictGame {
  readonly number: number;
  readonly deckSize: number;
  readonly placements: readonly Placement[];
}

export interface DistrictBest {
  readonly score: number;
  readonly game: DistrictGame;
}

// What a Planning office keeps: the number of the last game started, the game in hand (finished or not) and the best game played.
export interface DistrictOffice {
  readonly gameNumber: number;
  readonly game?: DistrictGame;
  readonly best?: DistrictBest;
}

export const EMPTY_DISTRICT_OFFICE: DistrictOffice = { gameNumber: 0 };

// Which Deck a game draws from.
export interface DistrictContext {
  readonly seed: string;
  readonly officeId: number;
}

export type DistrictRefusal = 'gameUnderWay' | 'noGameUnderWay' | 'invalidPlacement' | 'invalidRotation' | 'nothingToUndo';

export type DistrictOutcome = { readonly office: DistrictOffice } | { readonly refusal: DistrictRefusal };

export const isGameOver = (game: DistrictGame): boolean => game.placements.length >= game.deckSize;

const deckOfGame = (context: DistrictContext, game: DistrictGame): Hex[] => deckOf(context.seed, context.officeId, game.deckSize);

export const boardOf = (context: DistrictContext, game: DistrictGame): PlacedHex[] => {
  const deck = deckOfGame(context, game);
  return game.placements.map(({ cell, rotation }, index) => ({ cell, hex: rotateHex(deck[index]!, rotation) }));
};

export const scoreOfGame = (context: DistrictContext, game: DistrictGame): number => scoreOf(boardOf(context, game));

// The Hex to place and the next ones in view.
export const handOf = (context: DistrictContext, game: DistrictGame): { current: Hex | undefined; upcoming: Hex[] } => {
  const remaining = deckOfGame(context, game).slice(game.placements.length);
  return { current: remaining[0], upcoming: remaining.slice(1, 1 + DISTRICT_PLAN.previewCount) };
};

// A finished game replaces the best one only when it scores strictly more.
const withGame = (context: DistrictContext, office: DistrictOffice, game: DistrictGame): DistrictOffice => {
  if (!isGameOver(game)) return { ...office, game };
  const score = scoreOfGame(context, game);
  if (office.best && office.best.score >= score) return { ...office, game };
  return { ...office, game, best: { score, game } };
};

export const startGame = (context: DistrictContext, office: DistrictOffice, tier: number): DistrictOutcome => {
  if (office.game && !isGameOver(office.game)) return { refusal: 'gameUnderWay' };
  const number = office.gameNumber + 1;
  const game: DistrictGame = { number, deckSize: deckSizeOf(tier), placements: [{ cell: CENTRE, rotation: 0 }] };
  return { office: withGame(context, { ...office, gameNumber: number }, game) };
};

export const placeHex = (context: DistrictContext, office: DistrictOffice, cell: Cell, rotation: number): DistrictOutcome => {
  const game = office.game;
  if (!game || isGameOver(game)) return { refusal: 'noGameUnderWay' };
  if (!Number.isInteger(rotation) || rotation < 0 || rotation >= EDGE_COUNT) return { refusal: 'invalidRotation' };
  if (!isPlacementValid(boardOf(context, game), cell)) return { refusal: 'invalidPlacement' };
  return { office: withGame(context, office, { ...game, placements: [...game.placements, { cell, rotation }] }) };
};

// Takes back the last Hex placed, one at a time, down to the Start hex; a finished game is under way again, and the best score stays.
export const undoHex = (office: DistrictOffice): DistrictOutcome => {
  const game = office.game;
  if (!game || game.placements.length <= 1) return { refusal: 'nothingToUndo' };
  return { office: { ...office, game: { ...game, placements: game.placements.slice(0, -1) } } };
};

// The game in hand is dropped; the best score stays.
export const giveUp = (office: DistrictOffice): DistrictOutcome => {
  if (!office.game || isGameOver(office.game)) return { refusal: 'noGameUnderWay' };
  return { office: office.best ? { gameNumber: office.gameNumber, best: office.best } : { gameNumber: office.gameNumber } };
};
