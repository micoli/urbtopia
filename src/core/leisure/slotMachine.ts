import { nextRandom } from '../engine/random';

export const SLOT_SYMBOLS = ['cherry', 'lemon', 'bell', 'bar', 'star', 'seven'] as const;
export type SlotSymbol = typeof SLOT_SYMBOLS[number];

export const SLOT_REEL_COUNT = 3;

export const SLOT_PAYOUTS = { pair: 1.5, threeAlike: 10, threeSevens: 20 };

export type SlotOutcome = 'none' | 'pair' | 'threeAlike' | 'threeSevens';

export interface SlotSpin {
  reels: SlotSymbol[];
  outcome: SlotOutcome;
  payout: number;
  rngState: number;
}

export function slotOutcome(reels: readonly SlotSymbol[]): SlotOutcome {
  const [first, second, third] = reels;
  if (first === second && second === third) return first === 'seven' ? 'threeSevens' : 'threeAlike';
  if (first === second || second === third || first === third) return 'pair';
  return 'none';
}

export function slotPayout(outcome: SlotOutcome, stake: number): number {
  if (outcome === 'none') return 0;
  return Math.floor(stake * SLOT_PAYOUTS[outcome]);
}

export function spinSlotMachine(rngState: number, stake: number): SlotSpin {
  let state = rngState;
  const reels: SlotSymbol[] = [];
  for (let reel = 0; reel < SLOT_REEL_COUNT; reel++) {
    const draw = nextRandom(state);
    state = draw.rngState;
    reels.push(SLOT_SYMBOLS[Math.floor(draw.value * SLOT_SYMBOLS.length)]!);
  }
  const outcome = slotOutcome(reels);
  return { reels, outcome, payout: slotPayout(outcome, stake), rngState: state };
}
