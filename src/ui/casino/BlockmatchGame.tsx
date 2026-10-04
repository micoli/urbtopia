import { useState } from 'react';
import { useStore } from 'zustand';
import { stakeStepsOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { casinoStore } from '../../store/casinoStore';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { BlockmatchPlay } from './blockmatch/BlockmatchPlay';
import { BlockmatchStars } from './blockmatch/BlockmatchStars';
import { StakePicker } from './StakePicker';

interface BlockmatchGameProps {
  casino: Building;
}

export function BlockmatchGame({ casino }: BlockmatchGameProps) {
  const urbs = useGame(store => store.state.urbs);
  const round = useStore(casinoStore, store => store.round);
  const settled = useStore(casinoStore, store => store.settled);
  const steps = stakeStepsOf(casino.tier);
  const [stake, setStake] = useState(steps[0]!);
  const result = settled?.type === 'BlockmatchSettled' ? settled : null;
  const net = result ? result.payout - result.stake : 0;
  const start = () => gameStore.getState().send({ type: 'StartCasinoRound', buildingId: casino.id, game: 'blockmatch', stake });

  if (round?.game === 'blockmatch' && !result) return <BlockmatchPlay buildingId={casino.id} tier={casino.tier} roundSeed={round.roundSeed} />;
  return (
    <div className="casino-game">
      {result ? (
        <>
          <BlockmatchStars count={result.stars} />
          <p className="casino-result" data-win={net > 0} aria-live="polite">
            {net > 0 ? t('casino.won') : t('casino.lost')} <UrbsAmount value={Math.abs(net)} />
          </p>
        </>
      ) : null}
      <p>{t('casino.balance')}: <UrbsAmount value={urbs} /></p>
      <StakePicker steps={steps} urbs={urbs} value={stake} onChange={setStake} />
      <button type="button" className="collect-button" disabled={urbs < stake} onClick={start}>
        {result ? t('casino.newRound') : t('casino.deal')}
      </button>
    </div>
  );
}
