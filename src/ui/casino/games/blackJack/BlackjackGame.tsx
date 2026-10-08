import { useState } from 'react';
import { useStore } from 'zustand';
import { canDouble, stakeStepsOf, type Building } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { casinoStore } from '../../../../store/casinoStore.ts';
import { gameStore } from '../../../../store/gameStore.ts';
import { useGame } from '../../../common/hooks.ts';
import { UrbsAmount } from '../../../common/UrbsAmount.tsx';
import { BlackjackFelt } from './BlackjackFelt.tsx';
import { CasinoHeader } from '../../CasinoHeader.tsx';
import { blackjackResultKey } from './blackjackResult.ts';
import { winnerOf } from './blackjackWinner.ts';
import { useBlackjackRound } from './useBlackjackRound.ts';
import { ActionButton } from '../../../common/ActionButton';

interface BlackjackGameProps {
  casino: Pick<Building, 'id' | 'tier'>;
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
      <CasinoHeader spent={spent} won={won} steps={steps} urbs={urbs} stake={open?.stake ?? stake} locked={open !== null} onStake={setStake} />
      <BlackjackFelt
        dealer={hand?.dealer ?? []}
        player={hand?.player ?? []}
        holeCardHidden={open !== null && !finished}
        winner={winnerOf(hand)}
      />
      {open && hand ? (
        <div className="blackjack-actions">
          <ActionButton variant="primary" block disabled={finished} onClick={() => act('hit')}>{t('casino.hit')}</ActionButton>
          <ActionButton variant="primary" block disabled={finished} onClick={() => act('stand')}>{t('casino.stand')}</ActionButton>
          <ActionButton variant="primary" block disabled={!canDouble(hand) || urbs < open.stake} onClick={() => act('double')}>{t('casino.double')}</ActionButton>
        </div>
      ) : (
        <ActionButton variant="primary" block disabled={urbs < stake} onClick={deal}>
          {result ? t('casino.newRound') : t('casino.deal')}
        </ActionButton>
      )}
      <p className="casino-result" data-win={net > 0} aria-live="polite">
        {result && !open ? <>{t(blackjackResultKey(result.outcome))}{net === 0 ? null : <> · {net > 0 ? t('casino.won') : t('casino.lost')} <UrbsAmount value={Math.abs(net)} /></>}</> : ' '}
      </p>
    </div>
  );
}
