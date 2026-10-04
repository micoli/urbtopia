import { describe, expect, it } from 'vitest';
import type { BlackjackRound, Card } from '../../../../core';
import { winnerOf } from './blackjackWinner.ts';

const card = (rank: Card['rank'], suit: Card['suit'] = 'spades'): Card => ({ rank, suit });
const finished = (player: Card[], dealer: Card[]): BlackjackRound => ({ deck: [], drawn: 0, player, dealer, doubled: false, finished: true });

describe('blackjack winner', () => {
  it('names nobody before the round is over', () => {
    expect(winnerOf(null)).toBeNull();
    expect(winnerOf({ ...finished([card('9'), card('8')], [card('10'), card('7')]), finished: false })).toBeNull();
  });

  it('names the player on a higher total, a natural or a dealer bust', () => {
    expect(winnerOf(finished([card('10'), card('9')], [card('10'), card('7')]))).toBe('player');
    expect(winnerOf(finished([card('A'), card('K')], [card('10'), card('9')]))).toBe('player');
    expect(winnerOf(finished([card('10'), card('8')], [card('10'), card('6'), card('9')]))).toBe('player');
  });

  it('names the dealer on a higher total or a player bust', () => {
    expect(winnerOf(finished([card('10'), card('7')], [card('10'), card('9')]))).toBe('dealer');
    expect(winnerOf(finished([card('10'), card('6'), card('9')], [card('10'), card('7')]))).toBe('dealer');
  });

  it('calls a tie when the totals are equal', () => {
    expect(winnerOf(finished([card('10'), card('8')], [card('9'), card('9')]))).toBe('push');
  });
});
