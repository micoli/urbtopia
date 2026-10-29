import type { CommandOutcome } from '../engine/commands';
import type { Building, GameState } from '../engine/state';
import { hashSeed } from '../engine/random';
import { startChampionship } from './championship';
import { createClub, releasePlayer, signPlayer, advanceClub } from './club';
import type { ClubData, Lineup } from './clubTypes';
import { CLUB_MASCOTS, CLUB_PLACES } from './names';
import { sportRulesOf } from './sportRules';

const withClub = (state: GameState, building: Building, club: ClubData): GameState => ({
  ...state,
  buildings: state.buildings.map(candidate => (candidate === building ? { ...building, club } : candidate)),
});

const clubNameOf = (building: Building): string => {
  const hash = hashSeed(`club-name:${building.id}`);
  return `${CLUB_PLACES[hash % CLUB_PLACES.length]} ${CLUB_MASCOTS[Math.floor(hash / CLUB_PLACES.length) % CLUB_MASCOTS.length]}`;
};

export function foundClub(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const rules = sportRulesOf(building.type);
  if (!rules) return { key: 'error.unknownCommand' };
  if (building.club) return { key: 'error.clubExists' };
  return { state: withClub(state, building, startChampionship(createClub(rules, clubNameOf(building), `${state.nextId}:${building.id}:${building.type}`), state.lastSeen)), events: [] };
}

function change(state: GameState, buildingId: number, apply: (rules: NonNullable<ReturnType<typeof sportRulesOf>>, club: ClubData) => ReturnType<typeof signPlayer>): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const rules = sportRulesOf(building.type);
  if (!rules) return { key: 'error.unknownCommand' };
  if (!building.club) return { key: 'error.noClub' };
  const outcome = apply(rules, building.club);
  if ('error' in outcome) return { key: outcome.error };
  return { state: withClub(state, building, outcome.club), events: [] };
}

export function setClubLineup(state: GameState, buildingId: number, lineup: Lineup): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const rules = sportRulesOf(building.type);
  if (!rules) return { key: 'error.unknownCommand' };
  if (!building.club) return { key: 'error.noClub' };
  if (rules.lineupIssue?.(building.club, lineup)) return { key: 'error.invalidLineup' };
  return { state: withClub(state, building, { ...building.club, lineup }), events: [] };
}

export const signClubPlayer = (state: GameState, buildingId: number, playerId: number): CommandOutcome => change(state, buildingId, (rules, club) => signPlayer(rules, club, playerId));

export const releaseClubPlayer = (state: GameState, buildingId: number, playerId: number): CommandOutcome => change(state, buildingId, (rules, club) => releasePlayer(rules, club, playerId));

// The Clubs pay their Squads over the elapsed time.
export function advanceClubs(state: GameState, from: number, to: number): GameState {
  if (to <= from || !state.buildings.some(building => building.club)) return state;
  const hours = (to - from) / 3_600_000;
  return {
    ...state,
    buildings: state.buildings.map(building => {
      const rules = building.club ? sportRulesOf(building.type) : undefined;
      return building.club && rules ? { ...building, club: advanceClub(rules, building.club, hours) } : building;
    }),
  };
}
