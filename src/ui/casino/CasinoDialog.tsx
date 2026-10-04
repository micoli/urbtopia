import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { casinoStore } from '../../store/casinoStore';
import { useGame } from '../common/hooks';
import { SlotMachineGame } from './SlotMachineGame';

export function CasinoDialog() {
  const casinoId = useStore(casinoStore, store => store.casinoId);
  const game = useStore(casinoStore, store => store.game);
  const close = useStore(casinoStore, store => store.close);
  const casino = useGame(store => store.state.buildings.find(building => building.id === casinoId && building.type === 'casino'));
  if (!casino || game === null) return null;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label={t(`casino.${game}`)}>
      <div className="dialog casino-dialog">
        <header className="side-panel-header">
          <h2>{t(`casino.${game}`)}</h2>
          <button type="button" className="panel-close" aria-label={t('casino.close')} onClick={close}>✗</button>
        </header>
        {game === 'slotMachine' ? <SlotMachineGame casino={casino} /> : null}
      </div>
    </div>
  );
}
