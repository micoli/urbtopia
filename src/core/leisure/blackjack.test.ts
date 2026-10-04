import { describe, expect, it } from 'vitest';
import { applyBlackjackAction, blackjackOutcome, blackjackPayout, canDouble, dealBlackjack, freshDeck, handValue, isNatural, replayBlackjack, shuffledDeck, type BlackjackRound, type Card } from './blackjack';

const card = (rank: Card['rank'], suit: Card['suit'] = 'spades'): Card => ({ rank, suit });
const round = (player: Card[], dealer: Card[], deck: Card[] = [], extra: Partial<BlackjackRound> = {}): BlackjackRound => ({
  deck: [...player, ...dealer, ...deck], drawn: player.length + dealer.length, player, dealer, doubled: false, finished: false, ...extra,
});

describe('blackjack hands', () => {
  it('counts aces as 11 until that would bust', () => {
    expect(handValue([card('A'), card('K')])).toEqual({ total: 21, soft: true });
    expect(handValue([card('A'), card('K'), card('5')])).toEqual({ total: 16, soft: false });
    expect(handValue([card('A'), card('A'), card('9')])).toEqual({ total: 21, soft: true });
    expect(isNatural([card('A'), card('Q')])).toBe(true);
    expect(isNatural([card('7'), card('7'), card('7')])).toBe(false);
  });

  it('shuffles a full 52-card deck from the round seed, the same way every time', () => {
    expect(freshDeck()).toHaveLength(52);
    const deck = shuffledDeck(42);
    expect(new Set(deck.map(c => `${c.rank}${c.suit}`)).size).toBe(52);
    expect(shuffledDeck(42)).toEqual(deck);
    expect(shuffledDeck(43)).not.toEqual(deck);
  });
});

describe('blackjack rounds', () => {
  it('ends at once on a natural, paid 3:2, or a push when both have one', () => {
    const player = round([card('A'), card('K')], [card('9'), card('7')], [], { finished: true });
    expect(blackjackOutcome(player)).toBe('blackjack');
    expect(blackjackPayout('blackjack', 100, false)).toBe(250);
    expect(blackjackOutcome(round([card('A'), card('K')], [card('A', 'hearts'), card('Q')], [], { finished: true }))).toBe('push');
    expect(blackjackOutcome(round([card('9'), card('7')], [card('A'), card('Q')], [], { finished: true }))).toBe('lose');
  });

  it('loses on a bust without the dealer playing', () => {
    const after = applyBlackjackAction(round([card('10'), card('6')], [card('9'), card('5')], [card('K')]), 'hit')!;
    expect(after.finished).toBe(true);
    expect(blackjackOutcome(after)).toBe('lose');
    expect(after.dealer).toHaveLength(2);
  });

  it('draws the dealer to 16 and stands on 17, soft 17 included', () => {
    const play = (dealer: Card[], deck: Card[]) => applyBlackjackAction(round([card('10'), card('9')], dealer, deck), 'stand')!;
    expect(play([card('10'), card('6')], [card('2'), card('K')]).dealer).toHaveLength(3);
    expect(play([card('10'), card('7')], [card('2')]).dealer).toHaveLength(2);
    expect(play([card('A'), card('6')], [card('2')]).dealer).toHaveLength(2);
    const busted = play([card('10'), card('6')], [card('K')]);
    expect(blackjackOutcome(busted)).toBe('win');
  });

  it('compares totals for win, push and lose', () => {
    const outcome = (dealer: Card[]) => blackjackOutcome(applyBlackjackAction(round([card('10'), card('9')], dealer), 'stand')!);
    expect(outcome([card('10'), card('8')])).toBe('win');
    expect(outcome([card('10'), card('9')])).toBe('push');
    expect(outcome([card('10'), card('Q'), card('A', 'hearts')].slice(0, 2))).toBe('lose');
  });

  it('doubles once on the first two cards, takes one card and stands', () => {
    const start = round([card('5'), card('6')], [card('10'), card('7')], [card('10', 'hearts')]);
    expect(canDouble(start)).toBe(true);
    const doubled = applyBlackjackAction(start, 'double')!;
    expect(doubled.player).toHaveLength(3);
    expect(doubled.doubled).toBe(true);
    expect(doubled.finished).toBe(true);
    expect(blackjackOutcome(doubled)).toBe('win');
    expect(blackjackPayout('win', 100, true)).toBe(400);
    expect(applyBlackjackAction(applyBlackjackAction(start, 'hit')!, 'double')).toBeNull();
  });

  it('pays the Stake back on a push, nothing on a loss', () => {
    expect(blackjackPayout('push', 50, false)).toBe(50);
    expect(blackjackPayout('push', 50, true)).toBe(100);
    expect(blackjackPayout('lose', 50, true)).toBe(0);
  });

  it('replays a round from its seed and refuses unfinished or impossible action lists', () => {
    let seed = 1;
    while (dealBlackjack(seed).finished) seed += 1;
    expect(replayBlackjack(seed, [])).toBeNull();
    expect(replayBlackjack(seed, ['stand'])?.finished).toBe(true);
    expect(replayBlackjack(seed, ['stand', 'hit'])).toBeNull();
  });
});

describe('blackjack return', () => {
  it('returns a little under the Stake when the player copies the dealer', () => {
    let paid = 0;
    const rounds = 30_000;
    for (let seed = 1; seed <= rounds; seed++) {
      let current = dealBlackjack(seed * 7919);
      while (!current.finished) current = applyBlackjackAction(current, handValue(current.player).total < 17 ? 'hit' : 'stand')!;
      paid += blackjackPayout(blackjackOutcome(current), 100, current.doubled);
    }
    const rtp = paid / (rounds * 100);
    expect(rtp).toBeGreaterThan(0.85);
    expect(rtp).toBeLessThan(0.99);
  });
});
