import { useMemo } from 'react';
import { useStore } from 'zustand';
import {
  DISTRICT_PLAN, cellsOfBoard, districtBoardOf, districtBoardScoreOf, districtHandOf, districtRankOf, districtScoreOf, isDistrictGameOver, isDistrictPlacementValid, rotateHex,
  type Building, type Cell, type DistrictGame, type DistrictOffice, type DistrictRank, type Hex, type PlacedHex, EMPTY_DISTRICT_OFFICE,
} from '../../core';
import { districtStore } from '../../store/districtStore';
import { useGame } from '../common/hooks';

export interface DistrictView {
  office: DistrictOffice;
  game: DistrictGame | undefined;
  over: boolean;
  board: PlacedHex[];
  current: Hex | undefined;
  upcoming: Hex[];
  score: number;
  rank: DistrictRank | undefined;
  hexesLeft: number;
  // The cells the Hex in hand may go on, and what the picked cell would give once the Hex is turned as chosen.
  candidates: Cell[];
  picked: { cell: Cell; hex: Hex; valid: boolean } | null;
  gain: number | null;
  bestScore: number | undefined;
  bestRank: DistrictRank | undefined;
}

const BOARD_CELLS = cellsOfBoard(DISTRICT_PLAN.boardRadius);

export function useDistrictGame(building: Building): DistrictView {
  const seed = useGame(store => store.state.seed);
  const cell = useStore(districtStore, store => store.cell);
  const rotation = useStore(districtStore, store => store.rotation);
  const office = building.district ?? EMPTY_DISTRICT_OFFICE;
  const context = useMemo(() => ({ seed, officeId: building.id }), [seed, building.id]);

  const played = useMemo(() => {
    const game = office.game;
    if (!game) return { board: [] as PlacedHex[], current: undefined, upcoming: [] as Hex[], score: 0 };
    const hand = districtHandOf(context, game);
    return { board: districtBoardOf(context, game), current: hand.current, upcoming: hand.upcoming, score: districtScoreOf(context, game) };
  }, [context, office.game]);

  const game = office.game;
  const over = game ? isDistrictGameOver(game) : false;
  const candidates = useMemo(() => (game && !over ? BOARD_CELLS.filter(candidate => isDistrictPlacementValid(played.board, candidate)) : []), [game, over, played.board]);
  const turned = played.current ? rotateHex(played.current, rotation) : undefined;
  const picked = cell && turned && !over ? { cell, hex: turned, valid: isDistrictPlacementValid(played.board, cell) } : null;
  const gain = picked?.valid ? districtBoardScoreOf([...played.board, { cell: picked.cell, hex: picked.hex }]) - played.score : null;

  return {
    office,
    game,
    over,
    board: played.board,
    current: turned,
    upcoming: played.upcoming,
    score: played.score,
    rank: game ? districtRankOf(played.score, game.deckSize) : undefined,
    hexesLeft: game ? game.deckSize - game.placements.length : 0,
    candidates,
    picked,
    gain,
    bestScore: office.best?.score,
    bestRank: office.best ? districtRankOf(office.best.score, office.best.game.deckSize) : undefined,
  };
}
