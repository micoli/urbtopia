import { useState } from 'react';
import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { casinoStore } from '../../store/casinoStore';
import { gameStore } from '../../store/gameStore';
import { casinoOf } from '../../core';
import { useGame } from '../common/hooks';
import { CasinoGameView } from './CasinoGameView';
import { CasinoCloseContext } from './casinoCloseContext';
import { LeaveRoundDialog } from './LeaveRoundDialog';

export function CasinoDialog() {
  const casinoId = useStore(casinoStore, store => store.casinoId);
  const game = useStore(casinoStore, store => store.game);
  const round = useStore(casinoStore, store => store.round);
  const close = useStore(casinoStore, store => store.close);
  const tier = useGame(store => (casinoId === null ? undefined : casinoOf(store.state, casinoId)?.tier));
  const casino = casinoId !== null && tier !== undefined ? { id: casinoId, tier } : undefined;
  const [confirmLeave, setConfirmLeave] = useState(false);
  if (!casino || game === null) return null;

  const leave = () => {
    if (round) gameStore.getState().send({ type: 'AbandonCasinoRound' });
    setConfirmLeave(false);
    close();
  };
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label={t(`casino.${game}`)}>
      <div className="dialog casino-dialog">
        <CasinoCloseContext.Provider value={() => (round ? setConfirmLeave(true) : leave())}>
          <CasinoGameView game={game} casino={casino} />
        </CasinoCloseContext.Provider>
      </div>
      {confirmLeave ? <LeaveRoundDialog onStay={() => setConfirmLeave(false)} onLeave={leave} /> : null}
    </div>
  );
}
