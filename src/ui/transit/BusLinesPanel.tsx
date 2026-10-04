import { useState } from 'react';
import { transportStats } from '../../core';
import { lineStatusKey } from './lineStatusKey';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';

export function BusLinesPanel() {
  const state = useGame(s => s.state);
  const [editing, setEditing] = useState<number | undefined>();
  const [stops, setStops] = useState<number[]>([]);
  const transport = transportStats(state);
  const reset = () => { setEditing(undefined); setStops([]); };
  const save = () => {
    gameStore.getState().send({ type: 'SetBusLine', id: editing, stops });
    if (!gameStore.getState().lastError) reset();
  };
  return <section>
    <h3>{t('eco.lines')}</h3>
    <p>{t('eco.lineHelp')}</p>
    {transport.lines.filter(line => line.mode === 'bus').map(line => <div className="eco-line" key={line.id}>
      <strong>#{line.id}</strong> · {t(lineStatusKey(line.status))} · {line.riders.toFixed(1)} {t('eco.riders')}
      <p>{line.stops.join(' → ')}</p>
      <button type="button" onClick={() => { setEditing(line.id); setStops(line.stops); }}>{t('eco.editLine')}</button>
      <button type="button" onClick={() => gameStore.getState().send({ type: 'DeleteBusLine', id: line.id })}>{t('eco.deleteLine')}</button>
    </div>)}
    <h4>{editing === undefined ? t('eco.newLine') : `${t('eco.editLine')} #${editing}`}</h4>
    <p>{t('eco.selectedStops')}: {stops.join(' → ') || '—'}</p>
    <div className="eco-stop-buttons">{state.buildings.filter(b => b.type === 'busStop').map(stop =>
      <button type="button" key={stop.id} disabled={stops.includes(stop.id)} onClick={() => setStops(current => [...current, stop.id])}>
        {t('eco.stop')} #{stop.id} ({stop.x}, {stop.y})
      </button>)}</div>
    {stops.length > 0 && <button type="button" onClick={() => setStops([])}>{t('eco.clearStops')}</button>}
    {(stops.length > 0 || editing !== undefined) && <button type="button" onClick={reset}>{t('pad.cancel')}</button>}
    <ActionButton variant="primary" disabled={stops.length < 2} onClick={save}>{t('eco.saveLine')}</ActionButton>
  </section>;
}
