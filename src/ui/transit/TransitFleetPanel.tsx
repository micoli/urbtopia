import { TRANSIT, totalCitizens } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { SectionHeading } from '../common/SectionHeading';
import { UrbsAmount } from '../common/UrbsAmount';

export function TransitFleetPanel() {
  const state = useGame(s => s.state);
  return <section><SectionHeading>{t('transit.fleet')}</SectionHeading>
    {(['brtElectric', 'trainElectric', 'trainCoal'] as const).map(kind => <ActionButton key={kind}
      disabled={state.urbs < TRANSIT[kind].price || totalCitizens(state) < TRANSIT[kind === 'brtElectric' ? 'brt' : 'rail'].unlock}
      onClick={() => gameStore.getState().send({ type: 'BuyTransitVehicle', kind })}>
      {t('transit.buy')} {t(`transit.${kind}`)} · <UrbsAmount value={TRANSIT[kind].price} />
    </ActionButton>)}
    {(state.transitFleet ?? []).map(vehicle => <div className="eco-line" key={vehicle.id}>
      <strong>{t(`transit.${vehicle.kind}`)} #{vehicle.id}</strong>
      <select aria-label={`${t('transit.lines')} #${vehicle.id}`} value={vehicle.lineId ?? ''}
        onChange={e => gameStore.getState().send({ type: 'AssignTransitVehicle', id: vehicle.id, lineId: e.target.value ? Number(e.target.value) : undefined })}>
        <option value="">{t('transit.unassigned')}</option>
        {(state.transitLines ?? []).filter(l => (l.mode === 'brt') === (vehicle.kind === 'brtElectric')).map(line => <option key={line.id} value={line.id}>#{line.id} · {line.stops.join(' → ')}</option>)}
      </select>
      <ActionButton onClick={() => gameStore.getState().send({ type: 'SellTransitVehicle', id: vehicle.id })}>{t('transit.sell')} · <UrbsAmount value={vehicle.purchasePrice / 2} /></ActionButton>
    </div>)}
  </section>;
}
