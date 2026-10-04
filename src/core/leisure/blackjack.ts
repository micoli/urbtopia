import { nextRandom } from '../engine/random';

export const BLACKJACK_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const BLACKJACK_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

export type Rank = typeof BLACKJACK_RANKS[number];
export type Suit = typeof BLACKJACK_SUITS[number];
export interface Card {
  rank: Rank;
  suit: Suit;
}

export type BlackjackAction = 'hit' | 'stand' | 'double';
export type BlackjackOutcome = 'blackjack' | 'win' | 'push' | 'lose';

export interface BlackjackRound {
  deck: readonly Card[];
  drawn: number;
  player: readonly Card[];
  dealer: readonly Card[];
  doubled: boolean;
  finished: boolean;
}

export const DEALER_STANDS_ON = 17;
export const BLACKJACK_TARGET = 21;
export const NATURAL_PAYOUT = 2.5;

export function freshDeck(): Card[] {
  return BLACKJACK_SUITS.flatMap(suit => BLACKJACK_RANKS.map(rank => ({ rank, suit })));
}

export function shuffledDeck(roundSeed: number): Card[] {
  const deck = freshDeck();
  let state = roundSeed;
  for (let index = deck.length - 1; index > 0; index--) {
    const draw = nextRandom(state);
    state = draw.rngState;
    const other = Math.floor(draw.value * (index + 1));
    [deck[index], deck[other]] = [deck[other]!, deck[index]!];
  }
  return deck;
}

function cardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  return rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K' ? 10 : Number(rank);
}

export function handValue(cards: readonly Card[]): { total: number; soft: boolean } {
  let total = cards.reduce((sum, card) => sum + cardValue(card.rank), 0);
  let aces = cards.filter(card => card.rank === 'A').length;
  while (total > BLACKJACK_TARGET && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

export function isNatural(cards: readonly Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === BLACKJACK_TARGET;
}

export function isBust(cards: readonly Card[]): boolean {
  return handValue(cards).total > BLACKJACK_TARGET;
}

export function dealBlackjack(roundSeed: number): BlackjackRound {
  const deck = shuffledDeck(roundSeed);
  const round: BlackjackRound = { deck, drawn: 4, player: [deck[0]!, deck[2]!], dealer: [deck[1]!, deck[3]!], doubled: false, finished: false };
  return isNatural(round.player) || isNatural(round.dealer) ? { ...round, finished: true } : round;
}

function drawCard(round: BlackjackRound): { card: Card; drawn: number } {
  return { card: round.deck[round.drawn]!, drawn: round.drawn + 1 };
}

function playDealer(round: BlackjackRound): BlackjackRound {
  let current = round;
  while (handValue(current.dealer).total < DEALER_STANDS_ON) {
    const { card, drawn } = drawCard(current);
    current = { ...current, dealer: [...current.dealer, card], drawn };
  }
  return { ...current, finished: true };
}

export function canDouble(round: BlackjackRound): boolean {
  return !round.finished && round.player.length === 2;
}

export function applyBlackjackAction(round: BlackjackRound, action: BlackjackAction): BlackjackRound | null {
  if (round.finished) return null;
  if (action === 'stand') return playDealer(round);
  if (action === 'double' && !canDouble(round)) return null;
  const { card, drawn } = drawCard(round);
  const player = [...round.player, card];
  const next: BlackjackRound = { ...round, player, drawn, doubled: round.doubled || action === 'double' };
  if (isBust(player)) return { ...next, finished: true };
  if (action === 'double' || handValue(player).total === BLACKJACK_TARGET) return playDealer(next);
  return next;
}

export function replayBlackjack(roundSeed: number, actions: readonly BlackjackAction[]): BlackjackRound | null {
  let round = dealBlackjack(roundSeed);
  for (const action of actions) {
    const next = applyBlackjackAction(round, action);
    if (!next) return null;
    round = next;
  }
  return round.finished ? round : null;
}

export function blackjackOutcome(round: BlackjackRound): BlackjackOutcome {
  const naturalPlayer = isNatural(round.player);
  const naturalDealer = isNatural(round.dealer);
  if (naturalPlayer || naturalDealer) return naturalPlayer && naturalDealer ? 'push' : naturalPlayer ? 'blackjack' : 'lose';
  if (isBust(round.player)) return 'lose';
  if (isBust(round.dealer)) return 'win';
  const player = handValue(round.player).total;
  const dealer = handValue(round.dealer).total;
  return player > dealer ? 'win' : player === dealer ? 'push' : 'lose';
}

export function blackjackPayout(outcome: BlackjackOutcome, stake: number, doubled: boolean): number {
  const bet = doubled ? stake * 2 : stake;
  if (outcome === 'lose') return 0;
  if (outcome === 'push') return bet;
  if (outcome === 'win') return bet * 2;
  return Math.floor(stake * NATURAL_PAYOUT);
}
