import { DISTRICT_PLAN } from '../core/districtPlan/districtPlanBalance';
import { isCellPlaceable } from '../core/districtPlan/districtPlacement';
import { CENTRE, EDGE_COUNT, type Cell } from '../core/districtPlan/hexGrid';

type Json = Record<string, unknown>;

const MAX_DECK_SIZE = Math.max(...DISTRICT_PLAN.deckSizes);

const isRecord = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const isInt = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number => Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

const isCell = (value: unknown): value is Cell => isRecord(value) && isInt(value.q, -DISTRICT_PLAN.boardRadius, DISTRICT_PLAN.boardRadius) && isInt(value.r, -DISTRICT_PLAN.boardRadius, DISTRICT_PLAN.boardRadius);

const isPlacement = (value: unknown): value is { cell: Cell; rotation: number } => isRecord(value) && isCell(value.cell) && isInt(value.rotation, 0, EDGE_COUNT - 1);

// The Start hex sits at the centre unturned, and every other Hex was placed on a free cell touching the ones before it.
const isPlacementList = (placements: unknown, deckSize: number): boolean => {
  if (!Array.isArray(placements) || placements.length < 1 || placements.length > deckSize) return false;
  const [start, ...rest] = placements;
  if (!isPlacement(start) || start.cell.q !== CENTRE.q || start.cell.r !== CENTRE.r || start.rotation !== 0) return false;
  const taken: Cell[] = [start.cell];
  for (const placement of rest) {
    if (!isPlacement(placement) || !isCellPlaceable(taken, placement.cell)) return false;
    taken.push(placement.cell);
  }
  return true;
};

const isDistrictGame = (value: unknown, lastNumber: number): value is { number: number; deckSize: number; placements: unknown[] } =>
  isRecord(value) && isInt(value.number, 1, lastNumber) && isInt(value.deckSize, 1, MAX_DECK_SIZE) && isPlacementList(value.placements, value.deckSize);

// What a Planning office saves: the number of its last game, the game in hand, and its best game, which is a finished one.
export const isDistrictOffice = (value: unknown): boolean => {
  if (!isRecord(value) || !isInt(value.gameNumber, 0)) return false;
  const { gameNumber, game, best } = value;
  if (game !== undefined && !(isDistrictGame(game, gameNumber) && game.number === gameNumber)) return false;
  if (best === undefined) return true;
  return isRecord(best) && Number.isInteger(best.score) && isDistrictGame(best.game, gameNumber) && best.game.placements.length === best.game.deckSize;
};
