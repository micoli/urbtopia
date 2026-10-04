import { hashSeed } from '../engine/random';
import { CASINO, isValidStake } from './casino';
import { isCasinoPowered } from './poweredCasinos';
import { spinSlotMachine } from './slotMachine';
import type { CommandOutcome } from '../engine/commands';
import type { Building, GameState } from '../engine/state';

export function casinoRngState(state: GameState): number {
  return state.casinoRng ?? hashSeed(`${state.seed}:casino`);
}

type Opened = { casino: Building } | { error: CommandOutcome };

function openRound(state: GameState, buildingId: number, stake: number, minTier: number): Opened {
  const casino = state.buildings.find(building => building.id === buildingId);
  if (!casino || casino.type !== 'casino') return { error: { key: 'error.unknownBuilding' } };
  if (casino.tier < minTier) return { error: { key: 'error.tierTooLow' } };
  if (!isCasinoPowered(state, casino)) return { error: { key: 'error.casinoShut' } };
  if (!isValidStake(casino.tier, stake)) return { error: { key: 'error.invalidStake' } };
  if (state.urbs < stake) return { error: { key: 'error.notEnoughUrbs' } };
  return { casino };
}

export function playSlotMachine(state: GameState, buildingId: number, stake: number): CommandOutcome {
  const opened = openRound(state, buildingId, stake, CASINO.gameMinTier.slotMachine);
  if ('error' in opened) return opened.error;
  const spin = spinSlotMachine(casinoRngState(state), stake);
  return {
    state: { ...state, urbs: state.urbs - stake + spin.payout, casinoRng: spin.rngState },
    events: [{ type: 'SlotSpun', buildingId, stake, reels: spin.reels, outcome: spin.outcome, payout: spin.payout }],
  };
}
