import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { SLOT_REEL_COUNT, stakeStepsOf, type Building } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { casinoStore } from '../../../../store/casinoStore.ts';
import { gameStore } from '../../../../store/gameStore.ts';
import { useGame } from '../../../common/hooks.ts';
import { UrbsAmount } from '../../../common/UrbsAmount.tsx';
import { CasinoHeader } from '../../CasinoHeader.tsx';
import { SlotReels } from './SlotReels.tsx';
import { slotSpinDuration } from './slotSymbols.ts';
import { useFrozen } from '../../useFrozen.ts';

const SPIN_MS = slotSpinDuration(SLOT_REEL_COUNT);

interface SlotMachineGameProps {
  casino: Building;
}

export function SlotMachineGame({ casino }: SlotMachineGameProps) {
  const balance = useGame(store => store.state.urbs);
  const spin = useStore(casinoStore, store => store.lastSpin);
  const steps = stakeStepsOf(casino.tier);
  const [stake, setStake] = useState(steps[0]!);
  const [spinning, setSpinning] = useState(false);
  const urbs = useFrozen(balance, spinning);
  const spent = useFrozen(useStore(casinoStore, store => store.spent), spinning);
  const won = useFrozen(useStore(casinoStore, store => store.won), spinning);
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
      <CasinoHeader spent={spent} won={won} steps={steps} urbs={urbs} stake={stake} locked={spinning} onStake={setStake} />
      <SlotReels reels={spin?.reels ?? null} spinning={spinning} />
      <p className="casino-result" data-win={!spinning && net > 0} aria-live="polite">
        {spin === null || spinning ? ' ' : net > 0 ? <>{t('casino.won')} <UrbsAmount value={net} /></> : net === 0 ? t('casino.even') : <>{t('casino.lost')} <UrbsAmount value={-net} /></>}
      </p>
      <button type="button" className="collect-button" disabled={spinning || urbs < stake} onClick={play}>
        {t('casino.spin')}
      </button>
    </div>
  );
}
