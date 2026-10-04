import { useEffect, useRef, useState } from 'react';
import { applyBlackjackAction, dealBlackjack, type BlackjackAction, type BlackjackRound } from '../../core';
import { gameStore } from '../../store/gameStore';

export function useBlackjackRound(buildingId: number, roundSeed: number | null) {
  const [hand, setHand] = useState<BlackjackRound | null>(null);
  const [actions, setActions] = useState<BlackjackAction[]>([]);
  const settledSeed = useRef<number | null>(null);
  useEffect(() => {
    if (roundSeed === null) return;
    setHand(dealBlackjack(roundSeed));
    setActions([]);
  }, [roundSeed]);
  useEffect(() => {
    if (roundSeed === null || !hand?.finished || settledSeed.current === roundSeed) return;
    settledSeed.current = roundSeed;
    gameStore.getState().send({ type: 'SettleBlackjack', buildingId, actions });
  }, [hand?.finished, roundSeed, buildingId, actions]);

  const act = (action: BlackjackAction) => {
    if (!hand) return;
    const next = applyBlackjackAction(hand, action);
    if (!next) return;
    setActions(previous => [...previous, action]);
    setHand(next);
  };
  return { hand, act };
}
