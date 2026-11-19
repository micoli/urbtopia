import type { CommandError, CommandOutcome } from '../engine/commands';
import type { Building, GameState } from '../engine/state';
import { giveUp, placeHex, startGame, undoHex, EMPTY_DISTRICT_OFFICE, type DistrictContext, type DistrictOffice, type DistrictOutcome, type DistrictRefusal } from './districtGame';
import type { Cell } from './hexGrid';

const REFUSALS: Record<DistrictRefusal, CommandError['key']> = {
  gameUnderWay: 'error.districtGameUnderWay',
  noGameUnderWay: 'error.noDistrictGame',
  invalidPlacement: 'error.invalidDistrictPlacement',
  invalidRotation: 'error.unknownCommand',
  nothingToUndo: 'error.nothingToUndo',
};

export const isPlanningOffice = (building: Building): boolean => building.type === 'planningOffice';

// Replaces the games of one Planning office, or refuses with the key of the rule it broke.
const editDistrict = (state: GameState, buildingId: number, change: (office: DistrictOffice, context: DistrictContext, building: Building) => DistrictOutcome): CommandOutcome => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isPlanningOffice(building)) return { key: 'error.unknownBuilding' };
  const outcome = change(building.district ?? EMPTY_DISTRICT_OFFICE, { seed: state.seed, officeId: building.id }, building);
  if ('refusal' in outcome) return { key: REFUSALS[outcome.refusal] };
  return { state: { ...state, buildings: state.buildings.map(candidate => (candidate === building ? { ...building, district: outcome.office } : candidate)) }, events: [] };
};

export const startDistrictGame = (state: GameState, buildingId: number): CommandOutcome => editDistrict(state, buildingId, (office, context, building) => startGame(context, office, building.tier));

export const placeDistrictHex = (state: GameState, buildingId: number, cell: Cell, rotation: number): CommandOutcome => editDistrict(state, buildingId, (office, context) => placeHex(context, office, cell, rotation));

export const giveUpDistrictGame = (state: GameState, buildingId: number): CommandOutcome => editDistrict(state, buildingId, office => giveUp(office));

export const undoDistrictHex = (state: GameState, buildingId: number): CommandOutcome => editDistrict(state, buildingId, office => undoHex(office));
