import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { stakeStepsOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { casinoStore } from '../../store/casinoStore';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { SlotReels } from './SlotReels';
import { StakePicker } from './StakePicker';

const SPIN_MS = 700;

interface SlotMachineGameProps {
  casino: Building;
}

export function SlotMachineGame({ casino }: SlotMachineGameProps) {
  const urbs = useGame(store => store.state.urbs);
  const spin = useStore(casinoStore, store => store.lastSpin);
  const steps = stakeStepsOf(casino.tier);
  const [stake, setStake] = useState(steps[0]!);
  const [spinning, setSpinning] = useState(false);
  useEffect(() => {
    if (!spinning) return;
    const timer = setTimeout(() => setSpinning(false), SPIN_MS);
    return () => clearTimeout(timer);
  }, [spinning, spin]);

  const play = () => {
    setSpinning(true);
    gameStore.getState().send({ type: 'PlaySlotMachine', buildingId: casino.id, stake });
  };
  const net = spin ? spin.payout - spin.stake : 0;
  return (
    <div className="casino-game">
      <SlotReels reels={spin?.reels ?? null} spinning={spinning} />
      <p className="casino-result" data-win={!spinning && net > 0} aria-live="polite">
        {spin === null || spinning ? ' ' : net > 0 ? <>{t('casino.won')} <UrbsAmount value={net} /></> : net === 0 ? t('casino.even') : <>{t('casino.lost')} <UrbsAmount value={-net} /></>}
      </p>
      <p>{t('casino.balance')}: <UrbsAmount value={urbs} /></p>
      <StakePicker steps={steps} urbs={urbs} value={stake} disabled={spinning} onChange={setStake} />
      <button type="button" className="collect-button" disabled={spinning || urbs < stake} onClick={play}>
        {t('casino.spin')}
      </button>
    </div>
  );
}
