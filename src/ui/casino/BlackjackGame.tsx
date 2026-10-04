import { useState } from 'react';
import { useStore } from 'zustand';
import { stakeStepsOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { casinoStore } from '../../store/casinoStore';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { BlackjackTable } from './BlackjackTable';
import { StakePicker } from './StakePicker';
import { blackjackResultKey } from './blackjackResult';

interface BlackjackGameProps {
  casino: Building;
}

export function BlackjackGame({ casino }: BlackjackGameProps) {
  const urbs = useGame(store => store.state.urbs);
  const round = useStore(casinoStore, store => store.round);
  const settled = useStore(casinoStore, store => store.settled);
  const steps = stakeStepsOf(casino.tier);
  const [stake, setStake] = useState(steps[0]!);
  const deal = () => gameStore.getState().send({ type: 'StartCasinoRound', buildingId: casino.id, game: 'blackjack', stake });
  const net = settled ? settled.payout - settled.stake * (settled.doubled ? 2 : 1) : 0;

  if (round) return <BlackjackTable buildingId={casino.id} roundSeed={round.roundSeed} stake={round.stake} urbs={urbs} />;
  return (
    <div className="casino-game">
      {settled ? (
        <p className="casino-result" data-win={net > 0} aria-live="polite">
          {t(blackjackResultKey(settled.outcome))} · {net >= 0 ? t('casino.won') : t('casino.lost')} <UrbsAmount value={Math.abs(net)} />
        </p>
      ) : null}
      <p>{t('casino.balance')}: <UrbsAmount value={urbs} /></p>
      <StakePicker steps={steps} urbs={urbs} value={stake} onChange={setStake} />
      <button type="button" className="collect-button" disabled={urbs < stake} onClick={deal}>
        {settled ? t('casino.newRound') : t('casino.deal')}
      </button>
    </div>
  );
}
