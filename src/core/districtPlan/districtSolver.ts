import { DISTRICT_PLAN } from './districtPlanBalance';
import { HEX_CATEGORIES } from './districtPlanVocabulary';
import type { Hex } from './hex';
import { EDGE_COUNT, cellsOfBoard, neighbourOf, oppositeEdge } from './hexGrid';
import { pairScoreOf } from './districtScore';

// How many boards the search keeps at each step: the more, the better the plans it finds, and the longer it takes.
const BEAM_WIDTH = 25;

const CATEGORY_INDEX = new Map<string, number>(HEX_CATEGORIES.map((category, index) => [category, index]));
const PAIRS = HEX_CATEGORIES.map(a => HEX_CATEGORIES.map(b => pairScoreOf(a, b)));

const CELLS = cellsOfBoard(DISTRICT_PLAN.boardRadius);
const CELL_AT = new Map(CELLS.map((cell, index) => [`${cell.q},${cell.r}`, index]));
const CENTRE_INDEX = CELL_AT.get('0,0')!;
const NEIGHBOURS = CELLS.map(cell => Array.from({ length: EDGE_COUNT }, (_, edge) => CELL_AT.get(`${neighbourOf(cell, edge).q},${neighbourOf(cell, edge).r}`) ?? -1));
const OPPOSITE = Array.from({ length: EDGE_COUNT }, (_, edge) => oppositeEdge(edge));

interface Board {
  // The category of each edge of each cell, or -1 for a free cell.
  edges: Int8Array;
  score: number;
  // The sum of a mix of every Hex placed, so that two boards that hold the same Hexes in the same cells have the same hash, whatever the order.
  hash: number;
}

const mix = (value: number): number => {
  let x = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) | 0;
};

const rotationsOf = (hex: Hex): { edges: number[]; code: number }[] =>
  Array.from({ length: EDGE_COUNT }, (_, turns) => {
    const edges = hex.edges.map((_, edge) => CATEGORY_INDEX.get(hex.edges[(edge - turns + EDGE_COUNT) % EDGE_COUNT]!)!);
    return { edges, code: edges.reduce((code, category) => code * EDGE_COUNT + category, 0) };
  });

interface Move {
  score: number;
  hash: number;
  parent: Board;
  cell: number;
  rotation: number;
}

// The best score the search finds for a Deck: each Hex goes on the free cell, turned the way, that leads to the best boards, keeping the best few boards at each step.
export const bestScoreOf = (deck: readonly Hex[]): number => {
  const first = rotationsOf(deck[0]!)[0]!;
  const start: Board = { edges: new Int8Array(CELLS.length * EDGE_COUNT).fill(-1), score: 0, hash: 0 };
  start.edges.set(first.edges, CENTRE_INDEX * EDGE_COUNT);
  start.hash = mix(CENTRE_INDEX * 46656 + first.code);
  let boards: Board[] = [start];

  for (let index = 1; index < deck.length; index++) {
    const turned = rotationsOf(deck[index]!);
    const moves: Move[] = [];
    for (const board of boards) {
      for (let cell = 0; cell < CELLS.length; cell++) {
        if (board.edges[cell * EDGE_COUNT]! >= 0) continue;
        const neighbours = NEIGHBOURS[cell]!;
        if (!neighbours.some(neighbour => neighbour >= 0 && board.edges[neighbour * EDGE_COUNT]! >= 0)) continue;
        for (let rotation = 0; rotation < EDGE_COUNT; rotation++) {
          const { edges, code } = turned[rotation]!;
          let gain = 0;
          for (let edge = 0; edge < EDGE_COUNT; edge++) {
            const neighbour = neighbours[edge]!;
            if (neighbour < 0) continue;
            const facing = board.edges[neighbour * EDGE_COUNT + OPPOSITE[edge]!]!;
            if (facing >= 0) gain += PAIRS[edges[edge]!]![facing]!;
          }
          moves.push({ score: board.score + gain, hash: (board.hash + mix(cell * 46656 + code)) | 0, parent: board, cell, rotation });
        }
      }
    }
    moves.sort((a, b) => b.score - a.score);
    const seen = new Set<number>();
    boards = [];
    for (const move of moves) {
      if (seen.has(move.hash)) continue;
      seen.add(move.hash);
      const edges = new Int8Array(move.parent.edges);
      edges.set(turned[move.rotation]!.edges, move.cell * EDGE_COUNT);
      boards.push({ edges, score: move.score, hash: move.hash });
      if (boards.length === BEAM_WIDTH) break;
    }
  }
  return Math.max(...boards.map(board => board.score));
};
