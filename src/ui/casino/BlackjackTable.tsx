import { useEffect, useRef, useState } from 'react';
import { applyBlackjackAction, canDouble, dealBlackjack, type BlackjackAction, type BlackjackRound } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { UrbsAmount } from '../common/UrbsAmount';
import { CardHand } from './CardHand';

interface BlackjackTableProps {
  buildingId: number;
  roundSeed: number;
  stake: number;
  urbs: number;
}

export function BlackjackTable({ buildingId, roundSeed, stake, urbs }: BlackjackTableProps) {
  const [round, setRound] = useState<BlackjackRound>(() => dealBlackjack(roundSeed));
  const [actions, setActions] = useState<BlackjackAction[]>([]);
  const settledSeed = useRef<number | null>(null);
  useEffect(() => {
    setRound(dealBlackjack(roundSeed));
    setActions([]);
  }, [roundSeed]);
  useEffect(() => {
    if (!round.finished || settledSeed.current === roundSeed) return;
    settledSeed.current = roundSeed;
    gameStore.getState().send({ type: 'SettleBlackjack', buildingId, actions });
  }, [round.finished, roundSeed, buildingId, actions]);

  const act = (action: BlackjackAction) => {
    const next = applyBlackjackAction(round, action);
    if (!next) return;
    setActions(previous => [...previous, action]);
    setRound(next);
  };
  const hidden = !round.finished;
  return (
    <div className="casino-game">
      <CardHand label={t('casino.dealer')} cards={round.dealer} hideSecond={hidden} />
      <CardHand label={t('casino.player')} cards={round.player} />
      <p className="stat-tight">{t('casino.stake')}: <UrbsAmount value={stake} /></p>
      <div className="blackjack-actions">
        <button type="button" className="collect-button" disabled={round.finished} onClick={() => act('hit')}>{t('casino.hit')}</button>
        <button type="button" className="collect-button" disabled={round.finished} onClick={() => act('stand')}>{t('casino.stand')}</button>
        <button type="button" className="collect-button" disabled={!canDouble(round) || urbs < stake} onClick={() => act('double')}>{t('casino.double')}</button>
      </div>
    </div>
  );
}
