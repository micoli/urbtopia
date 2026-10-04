import { useEffect, useRef, useState } from 'react';
import { applyBlackjackAction, type BlackjackAction } from '../../core';
import { gameStore } from '../../store/gameStore';
import { sessionFor, type BlackjackSession } from './blackjackSession';

export function useBlackjackRound(buildingId: number, roundSeed: number | null) {
  const [stored, setStored] = useState<BlackjackSession | null>(null);
  const session = sessionFor(stored, roundSeed);
  if (session !== stored) setStored(session);
  const settledSeed = useRef<number | null>(null);
  useEffect(() => {
    if (roundSeed === null || !session || session.seed !== roundSeed || !session.hand.finished || settledSeed.current === roundSeed) return;
    settledSeed.current = roundSeed;
    gameStore.getState().send({ type: 'SettleBlackjack', buildingId, actions: session.actions });
  }, [session, roundSeed, buildingId]);

  const act = (action: BlackjackAction) => {
    if (!session) return;
    const next = applyBlackjackAction(session.hand, action);
    if (!next) return;
    setStored({ ...session, hand: next, actions: [...session.actions, action] });
  };
  return { hand: session?.hand ?? null, act };
}
