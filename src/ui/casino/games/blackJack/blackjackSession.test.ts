import { describe, expect, it } from 'vitest';
import { applyBlackjackAction, dealBlackjack } from '../../core';
import { sessionFor, type BlackjackSession } from './blackjackSession';

const playedOut = (seed: number): BlackjackSession => {
  let hand = dealBlackjack(seed);
  const actions: BlackjackSession['actions'] = [];
  while (!hand.finished) {
    actions.push('stand');
    hand = applyBlackjackAction(hand, 'stand')!;
  }
  return { seed, hand, actions };
};

describe('blackjack session', () => {
  it('keeps the last hand on screen when no round is open', () => {
    const last = playedOut(1);
    expect(sessionFor(last, null)).toBe(last);
    expect(sessionFor(null, null)).toBeNull();
  });

  it('keeps the same session while the round seed does not change', () => {
    const last = playedOut(1);
    expect(sessionFor(last, 1)).toBe(last);
  });

  it('never carries the finished hand and the actions of a round over to the next one', () => {
    const last = playedOut(1);
    const next = sessionFor(last, 2)!;
    expect(next.seed).toBe(2);
    expect(next.actions).toEqual([]);
    expect(next.hand).toEqual(dealBlackjack(2));
  });
});
