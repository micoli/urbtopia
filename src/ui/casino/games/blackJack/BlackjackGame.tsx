import { useState } from 'react';
import { useStore } from 'zustand';
import { canDouble, stakeStepsOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { casinoStore } from '../../store/casinoStore';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { BlackjackFelt } from './BlackjackFelt';
import { CasinoLedger } from './CasinoLedger';
import { StakePicker } from './StakePicker';
import { blackjackResultKey } from './blackjackResult';
import { useBlackjackRound } from './useBlackjackRound';

interface BlackjackGameProps {
  casino: Building;
}

export function BlackjackGame({ casino }: BlackjackGameProps) {
  const urbs = useGame(store => store.state.urbs);
  const round = useStore(casinoStore, store => store.round);
  const settled = useStore(casinoStore, store => store.settled);
  const spent = useStore(casinoStore, store => store.spent);
  const won = useStore(casinoStore, store => store.won);
  const open = round?.game === 'blackjack' ? round : null;
  const { hand, act } = useBlackjackRound(casino.id, open?.roundSeed ?? null);
  const steps = stakeStepsOf(casino.tier);
  const [stake, setStake] = useState(steps[0]!);
  const deal = () => gameStore.getState().send({ type: 'StartCasinoRound', buildingId: casino.id, game: 'blackjack', stake });
  const result = settled?.type === 'BlackjackSettled' ? settled : null;
  const net = result ? result.payout - result.stake * (result.doubled ? 2 : 1) : 0;
  const finished = hand?.finished ?? false;

  return (
    <div className="casino-game">
      <CasinoLedger spent={spent} won={won} />
      <BlackjackFelt
        dealer={hand?.dealer ?? []}
        player={hand?.player ?? []}
        holeCardHidden={open !== null && !finished}
        stake={open ? <UrbsAmount value={open.stake} /> : <UrbsAmount value={stake} />}
      />
      {open && hand ? (
        <div className="blackjack-actions">
          <button type="button" className="collect-button" disabled={finished} onClick={() => act('hit')}>{t('casino.hit')}</button>
          <button type="button" className="collect-button" disabled={finished} onClick={() => act('stand')}>{t('casino.stand')}</button>
          <button type="button" className="collect-button" disabled={!canDouble(hand) || urbs < open.stake} onClick={() => act('double')}>{t('casino.double')}</button>
        </div>
      ) : (
        <>
          {result ? (
            <p className="casino-result" data-win={net > 0} aria-live="polite">
              {t(blackjackResultKey(result.outcome))}{net === 0 ? null : <> · {net > 0 ? t('casino.won') : t('casino.lost')} <UrbsAmount value={Math.abs(net)} /></>}
            </p>
          ) : null}
          <StakePicker steps={steps} urbs={urbs} value={stake} onChange={setStake} />
          <button type="button" className="collect-button" disabled={urbs < stake} onClick={deal}>
            {result ? t('casino.newRound') : t('casino.deal')}
          </button>
        </>
      )}
    </div>
  );
}
