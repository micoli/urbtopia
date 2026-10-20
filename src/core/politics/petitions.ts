import { isHomeType } from '../buildings/buildingDefinitions';
import { FACILITY_TYPES, type ServiceKey } from '../services/facilities';
import { GAME_CONFIG } from '../engine/config';
import { nextRandom } from '../engine/random';
import type { Building, GameState } from '../engine/state';
import { isAdapting } from '../environment/adaptation';
import { homePower } from '../environment/ecology';
import type { NeedFactorId } from '../environment/needFactors';
import { homeNeedSatisfactions, needsContext, type NeedsContext } from '../environment/needs';
import type { Coord } from '../map/coord';
import { missingServicesOf } from '../services/services';
import { POLITICS, politicsRuleOf } from './politicsBalance';
import { difficultyOf } from '../engine/difficulty';
import type { PoliticsState } from './politics';

export type PetitionCause = ServiceKey | 'electricity' | 'pollution' | 'congestion';

export const PETITION_CAUSES: readonly PetitionCause[] = [...FACILITY_TYPES, 'waste', 'electricity', 'pollution', 'congestion'];

// What Citizens welcome: the Need factors that can be praised.
export const SUPPORT_CAUSES = ['greenSpaces', 'walking', 'culture'] as const satisfies readonly NeedFactorId[];

export type SupportCause = (typeof SUPPORT_CAUSES)[number];

export interface Petition {
  id: number;
  cause: PetitionCause;
  parcel: Coord;
  // The game day it was filed.
  since: number;
  escalated: boolean;
}

export interface Support {
  id: number;
  cause: SupportCause;
  parcel: Coord;
  since: number;
}

// Below this share of its power Demand, a Home complains of electricity.
const POWER_SHORTAGE_RATIO = 0.5;

const parcelOf = (home: Building): Coord => ({ x: Math.floor(home.x / GAME_CONFIG.parcelSizeInTiles), y: Math.floor(home.y / GAME_CONFIG.parcelSizeInTiles) });

const keyOf = ({ x, y }: Coord): string => `${x}:${y}`;

export function homeCauses(state: GameState, home: Building, context: NeedsContext): PetitionCause[] {
  const satisfactions = homeNeedSatisfactions(state, home, context);
  const { belowSatisfaction } = POLITICS.petitions;
  const causes: PetitionCause[] = missingServicesOf(state, home, home.tier, context.coverage);
  const need = homePower(home);
  if (need > 0 && (context.energy.supplied.get(home.id) ?? 0) / need < POWER_SHORTAGE_RATIO) causes.push('electricity');
  for (const cause of ['pollution', 'congestion'] as const) if ((satisfactions.get(cause) ?? 100) < belowSatisfaction) causes.push(cause);
  return causes;
}

interface District {
  parcel: Coord;
  causes: Set<PetitionCause>;
  praised: Set<SupportCause>;
}

function districtsOf(state: GameState, context: NeedsContext): Map<string, District> {
  const districts = new Map<string, District>();
  const homesByDistrict = new Map<string, Building[]>();
  for (const home of state.buildings) {
    if (!isHomeType(home.type)) continue;
    const key = keyOf(parcelOf(home));
    homesByDistrict.set(key, [...(homesByDistrict.get(key) ?? []), home]);
  }
  const adapting = isAdapting(state);
  for (const [key, homes] of [...homesByDistrict].sort(([a], [b]) => a.localeCompare(b))) {
    const causes = new Set<PetitionCause>(adapting ? [] : homes.flatMap(home => homeCauses(state, home, context)));
    const satisfactions = homes.map(home => homeNeedSatisfactions(state, home, context));
    const praised = new Set(SUPPORT_CAUSES.filter(cause => satisfactions.every(values => (values.get(cause) ?? 0) >= POLITICS.petitions.supportAbove)));
    districts.set(key, { parcel: parcelOf(homes[0]!), causes, praised });
  }
  return districts;
}

export interface PetitionOutcome {
  politics: PoliticsState;
  // Points of Approval to add as one-off shocks.
  shock: number;
}

// Plays one game day of Petitions and Support: the handled ones close, the ignored ones escalate, new ones are filed.
export function advancePetitions(state: GameState, politics: PoliticsState): PetitionOutcome {
  const rule = politicsRuleOf(difficultyOf(state));
  const day = politics.day + 1;
  const districts = districtsOf(state, needsContext(state));
  const { petitions: balance, approval } = POLITICS;
  let shock = 0;
  let rngState = politics.rngState;
  let nextPetitionId = politics.nextPetitionId;
  const draw = (): number => {
    const next = nextRandom(rngState);
    rngState = next.rngState;
    return next.value;
  };

  const petitions: Petition[] = [];
  for (const petition of politics.petitions) {
    if (!districts.get(keyOf(petition.parcel))?.causes.has(petition.cause)) {
      if (rule.demonstrations) shock += approval.shocks.petitionHandled;
      continue;
    }
    const escalates = rule.demonstrations && !petition.escalated && day >= politics.adaptationUntilDay && day - petition.since >= balance.escalationDays;
    if (escalates) shock += approval.shocks.demonstration;
    petitions.push(escalates ? { ...petition, escalated: true } : petition);
  }
  for (const [key, district] of districts) {
    for (const cause of [...district.causes].sort()) {
      if (petitions.length >= balance.maxOpen) break;
      if (petitions.some(open => keyOf(open.parcel) === key && open.cause === cause)) continue;
      if (draw() >= balance.chancePerDay) continue;
      petitions.push({ id: nextPetitionId++, cause, parcel: district.parcel, since: day, escalated: false });
    }
  }

  const supports: Support[] = politics.supports.filter(support => day - support.since < balance.supportDays);
  for (const [key, district] of districts) {
    for (const cause of SUPPORT_CAUSES) {
      if (supports.length >= balance.maxSupport) break;
      if (!district.praised.has(cause) || supports.some(open => keyOf(open.parcel) === key && open.cause === cause)) continue;
      if (draw() >= balance.supportChancePerDay) continue;
      supports.push({ id: nextPetitionId++, cause, parcel: district.parcel, since: day });
    }
  }
  return { politics: { ...politics, rngState, nextPetitionId, petitions, supports }, shock };
}
