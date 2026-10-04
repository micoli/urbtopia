import { useState } from 'react';
import { totalCitizens, TRANSIT, transportStats, type TransitLine } from '../../core';
import { lineStatusKey } from './lineStatusKey';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { TransitFleetPanel } from './TransitFleetPanel';
import { NumberStepper } from '../common/NumberStepper';

export function TransitPanel() {
  const state = useGame(s => s.state);
  const [mode, setMode] = useState<'brt' | 'rail'>('brt');
  const [editing, setEditing] = useState<number | undefined>();
  const [stops, setStops] = useState<number[]>([]);
  const [peak, setPeak] = useState(5), [offPeak, setOffPeak] = useState(12);
  const stats = transportStats(state);
  const reset = () => { setEditing(undefined); setStops([]); };
  const edit = (line: TransitLine) => { setMode(line.mode); setEditing(line.id); setStops(line.stops); setPeak(line.peakHeadway); setOffPeak(line.offPeakHeadway); };
  const save = () => {
    gameStore.getState().send({ type: 'SetTransitLine', id: editing, mode, stops, peakHeadway: peak, offPeakHeadway: offPeak });
    if (!gameStore.getState().lastError) reset();
  };
  return <section className="transit-panel">
    <h3>{t('transit.brt')} / {t('transit.rail')}</h3>
    <p>{t('transit.help')}</p><p>{t('transit.coverage')}</p>
    <p>{t('transit.transfers')}: {stats.transferRiders.toFixed(1)} · {t('transit.coal')}: {stats.coalPerHour.toFixed(2)}</p>
    {stats.lines.filter(l => l.mode !== 'bus').map(line => <div className="eco-line" key={line.id}>
      <strong>{t(line.mode === 'brt' ? 'transit.brt' : 'transit.rail')} #{line.id}</strong> · {t(lineStatusKey(line.status))}
      <p>{line.stops.join(' → ')} · {t('eco.riders')}: {line.riders.toFixed(1)} / {line.capacity.toFixed(1)}</p>
      <p>{t('transit.vehicles')}: {line.vehicleCount} · {t('transit.headway')}: {Number.isFinite(line.headway) ? `${line.headway.toFixed(1)} min` : '—'}</p>
      <button type="button" onClick={() => edit(state.transitLines!.find(l => l.id === line.id)!)}>{t('eco.editLine')}</button>
      <button type="button" onClick={() => gameStore.getState().send({ type: 'DeleteTransitLine', id: line.id })}>{t('eco.deleteLine')}</button>
    </div>)}
    <h4>{t(editing === undefined ? 'eco.newLine' : 'eco.editLine')}</h4>
    <select aria-label={t('eco.transport')} value={mode} disabled={editing !== undefined} onChange={event => { setMode(event.target.value as 'brt' | 'rail'); reset(); }}>
      <option value="brt">{t('transit.brt')} · {TRANSIT.brt.unlock} 👥</option><option value="rail">{t('transit.rail')} · {TRANSIT.rail.unlock} 👥</option>
    </select>
    <p>{t('eco.selectedStops')}: {stops.join(' → ') || '—'}</p>
    <div className="eco-stop-buttons">{state.buildings.filter(b => b.type === (mode === 'brt' ? 'brtStation' : 'railStation')).map(stop =>
      <button type="button" key={stop.id} disabled={stops.includes(stop.id)} onClick={() => setStops(current => [...current, stop.id])}>{t(`building.${stop.type}`)} #{stop.id} ({stop.x}, {stop.y})</button>)}</div>
    <NumberStepper label={t('transit.peak')} min={mode === 'brt' ? 5 : 1} max={mode === 'brt' ? 10 : 60} value={peak} onChange={setPeak} />
    <NumberStepper label={t('transit.offPeak')} min={mode === 'brt' ? 10 : 1} max={mode === 'brt' ? 15 : 60} value={offPeak} onChange={setOffPeak} />
    {stops.length > 0 && <button type="button" onClick={() => setStops([])}>{t('eco.clearStops')}</button>}
    {(stops.length > 0 || editing !== undefined) && <button type="button" onClick={reset}>{t('pad.cancel')}</button>}
    <button type="button" className="eco-primary" disabled={stops.length < 2 || totalCitizens(state) < TRANSIT[mode].unlock} onClick={save}>{t('eco.saveLine')}</button>
    &nbsp;
    <button type="button" onClick={() => gameStore.getState().send({ type: 'RepairTransitNetwork', mode })}>{t('transit.repair')}</button>
    <TransitFleetPanel />
  </section>;
}
