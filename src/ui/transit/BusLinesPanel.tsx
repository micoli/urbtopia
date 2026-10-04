import { useState } from 'react';
import { transportStats } from '../../core';
import { lineStatusKey } from './lineStatusKey';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { SectionHeading } from '../common/SectionHeading';

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
    <SectionHeading>{t('eco.lines')}</SectionHeading>
    <p>{t('eco.lineHelp')}</p>
    {transport.lines.filter(line => line.mode === 'bus').map(line => <div className="eco-line" key={line.id}>
      <strong>#{line.id}</strong> · {t(lineStatusKey(line.status))} · {line.riders.toFixed(1)} {t('eco.riders')}
      <p>{line.stops.join(' → ')}</p>
      <ActionButton onClick={() => { setEditing(line.id); setStops(line.stops); }}>{t('eco.editLine')}</ActionButton>
      <ActionButton onClick={() => gameStore.getState().send({ type: 'DeleteBusLine', id: line.id })}>{t('eco.deleteLine')}</ActionButton>
    </div>)}
    <h4>{editing === undefined ? t('eco.newLine') : `${t('eco.editLine')} #${editing}`}</h4>
    <p>{t('eco.selectedStops')}: {stops.join(' → ') || '—'}</p>
    <div className="eco-stop-buttons">{state.buildings.filter(b => b.type === 'busStop').map(stop =>
      <ActionButton key={stop.id} disabled={stops.includes(stop.id)} onClick={() => setStops(current => [...current, stop.id])}>
        {t('eco.stop')} #{stop.id} ({stop.x}, {stop.y})
      </ActionButton>)}</div>
    {stops.length > 0 && <ActionButton onClick={() => setStops([])}>{t('eco.clearStops')}</ActionButton>}
    {(stops.length > 0 || editing !== undefined) && <ActionButton onClick={reset}>{t('pad.cancel')}</ActionButton>}
    <ActionButton variant="primary" className="eco-primary" disabled={stops.length < 2} onClick={save}>{t('eco.saveLine')}</ActionButton>
  </section>;
}
