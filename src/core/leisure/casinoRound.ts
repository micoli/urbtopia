import { hashSeed, nextRandom } from '../engine/random';
import { CASINO, isValidStake } from './casino';
import { isCasinoPowered } from './poweredCasinos';
import { blackjackOutcome, blackjackPayout, replayBlackjack, type BlackjackAction } from './blackjack';
import { MAX_BLOCKMATCH_STARS, blockmatchPayout } from './blockmatchRound';
import { spinSlotMachine } from './slotMachine';
import type { CommandOutcome } from '../engine/commands';
import { casinoOf, boatsOf, isBoatOperating } from '../water/boats';
import type { GameState } from '../engine/state';

export function casinoRngState(state: GameState): number {
  return state.casinoRng ?? hashSeed(`${state.seed}:casino`);
}

export function withoutOpenRound(state: GameState): GameState {
  const next = { ...state };
  delete next.openRound;
  return next;
}

type Opened = { casino: { id: number; tier: number } } | { error: CommandOutcome };

function openRound(state: GameState, buildingId: number, stake: number, minTier: number): Opened {
  const casino = casinoOf(state, buildingId);
  if (!casino) return { error: { key: 'error.unknownBuilding' } };
  if (casino.tier < minTier) return { error: { key: 'error.tierTooLow' } };
  if (!isOpen(state, casino.id)) return { error: { key: 'error.casinoShut' } };
  if (!isValidStake(casino.tier, stake)) return { error: { key: 'error.invalidStake' } };
  if (state.urbs < stake) return { error: { key: 'error.notEnoughUrbs' } };
  return { casino };
}

function isOpen(state: GameState, id: number): boolean {
  const building = state.buildings.find(candidate => candidate.id === id);
  if (building) return isCasinoPowered(state, building);
  const boat = boatsOf(state).find(candidate => candidate.id === id);
  return boat !== undefined && isBoatOperating(state, boat);
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

const UINT32_RANGE = 4294967296;

export function startCasinoRound(state: GameState, buildingId: number, game: 'blackjack' | 'blockmatch', stake: number): CommandOutcome {
  const opened = openRound(state, buildingId, stake, CASINO.gameMinTier[game]);
  if ('error' in opened) return opened.error;
  const draw = nextRandom(casinoRngState(state));
  const roundSeed = Math.floor(draw.value * UINT32_RANGE);
  return {
    state: { ...state, urbs: state.urbs - stake, casinoRng: draw.rngState, openRound: { buildingId, game, stake, roundSeed } },
    events: [{ type: 'CasinoRoundStarted', buildingId, game, stake, roundSeed }],
  };
}

export function abandonCasinoRound(state: GameState): CommandOutcome {
  return { state: withoutOpenRound(state), events: [] };
}

export function settleBlackjack(state: GameState, buildingId: number, actions: readonly BlackjackAction[]): CommandOutcome {
  const open = state.openRound;
  if (!open || open.game !== 'blackjack' || open.buildingId !== buildingId) return { key: 'error.noOpenRound' };
  const round = replayBlackjack(open.roundSeed, actions);
  if (!round) return { key: 'error.invalidRound' };
  const extraStake = round.doubled ? open.stake : 0;
  if (state.urbs < extraStake) return { key: 'error.notEnoughUrbs' };
  const outcome = blackjackOutcome(round);
  const payout = blackjackPayout(outcome, open.stake, round.doubled);
  return {
    state: { ...withoutOpenRound(state), urbs: state.urbs - extraStake + payout },
    events: [{ type: 'BlackjackSettled', buildingId, stake: open.stake, doubled: round.doubled, outcome, payout }],
  };
}

export function settleBlockmatch(state: GameState, buildingId: number, stars: number): CommandOutcome {
  const open = state.openRound;
  if (!open || open.game !== 'blockmatch' || open.buildingId !== buildingId) return { key: 'error.noOpenRound' };
  if (!Number.isInteger(stars) || stars < 0 || stars > MAX_BLOCKMATCH_STARS) return { key: 'error.invalidRound' };
  const payout = blockmatchPayout(stars, open.stake);
  return {
    state: { ...withoutOpenRound(state), urbs: state.urbs + payout },
    events: [{ type: 'BlockmatchSettled', buildingId, stake: open.stake, stars, payout }],
  };
}
