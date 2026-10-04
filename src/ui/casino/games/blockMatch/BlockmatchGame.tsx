import { useState } from 'react';
import { useStore } from 'zustand';
import { stakeStepsOf, type Building } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { casinoStore } from '../../../../store/casinoStore.ts';
import { gameStore } from '../../../../store/gameStore.ts';
import { useGame } from '../../../common/hooks.ts';
import { BlockmatchPlay } from './BlockmatchPlay.tsx';
import { BlockmatchResult } from './BlockmatchResult.tsx';
import { CasinoHeader } from '../../CasinoHeader.tsx';
import { ActionButton } from '../../../common/ActionButton';

interface BlockmatchGameProps {
  casino: Building;
}

export function BlockmatchGame({ casino }: BlockmatchGameProps) {
  const urbs = useGame(store => store.state.urbs);
  const round = useStore(casinoStore, store => store.round);
  const settled = useStore(casinoStore, store => store.settled);
  const spent = useStore(casinoStore, store => store.spent);
  const won = useStore(casinoStore, store => store.won);
  const steps = stakeStepsOf(casino.tier);
  const [stake, setStake] = useState(steps[0]!);
  const result = settled?.type === 'BlockmatchSettled' ? settled : null;
  const net = result ? result.payout - result.stake : 0;
  const start = () => gameStore.getState().send({ type: 'StartCasinoRound', buildingId: casino.id, game: 'blockmatch', stake });

  const playing = round?.game === 'blockmatch' && !result;
  const header = <CasinoHeader spent={spent} won={won} steps={steps} urbs={urbs} stake={playing ? round.stake : stake} locked={playing} onStake={setStake} />;
  return (
    <div className="casino-game">
      {header}
      <div className="blockmatch-stage">
        {playing ? <BlockmatchPlay buildingId={casino.id} tier={casino.tier} roundSeed={round.roundSeed} /> : null}
        {!playing && result ? <BlockmatchResult stars={result.stars} net={net} /> : null}
      </div>
      <ActionButton variant="primary" block style={playing ? { visibility: 'hidden' } : undefined} aria-hidden={playing} tabIndex={playing ? -1 : 0} disabled={playing || urbs < stake} onClick={start}>
        {result ? t('casino.newRound') : t('casino.deal')}
      </ActionButton>
    </div>
  );
}
