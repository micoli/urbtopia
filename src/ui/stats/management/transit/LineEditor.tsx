import { useMemo, useState } from 'react';
import { routeFailure, totalCitizens, TRANSIT, type TransitMode } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { gameStore } from '../../../../store/gameStore.ts';
import { ActionButton } from '../../../common/ActionButton.tsx';
import { Dropdown } from '../../../common/Dropdown.tsx';
import { NumberStepper } from '../../../common/NumberStepper.tsx';
import { RadioChipGroup } from '../../../common/RadioChipGroup.tsx';
import { useGame } from '../../../common/hooks.ts';
import {
  DEFAULT_OFF_PEAK_HEADWAY, DEFAULT_PEAK_HEADWAY, HEADWAY_LIMITS, MODE_LABEL, STOP_TYPE, TRANSIT_MODES, findLine, unlockOf,
} from './lineModels.ts';
import { LineMetrics, type LineSummary } from './LineMetrics.tsx';
import { StopList } from './StopList.tsx';
import { routeFailureKey } from './routeFailureKey.ts';

interface LineEditorProps {
  lineId: number | undefined;
  summary: LineSummary | undefined;
  onSaved: (id: number) => void;
  onDeleted: () => void;
  onCancel: () => void;
}

export function LineEditor({ lineId, summary, onSaved, onDeleted, onCancel }: LineEditorProps) {
  const state = useGame(s => s.state);
  const existing = findLine(state, lineId);
  const [mode, setMode] = useState<TransitMode>(existing?.mode ?? 'bus');
  const [stops, setStops] = useState<number[]>(existing?.stops ?? []);
  const [peak, setPeak] = useState(existing?.peakHeadway ?? DEFAULT_PEAK_HEADWAY);
  const [offPeak, setOffPeak] = useState(existing?.offPeakHeadway ?? DEFAULT_OFF_PEAK_HEADWAY);
  const citizens = totalCitizens(state);
  const failure = useMemo(() => {
    if (stops.length < 2) return null;
    return routeFailure(state, mode === 'bus' ? { id: 0, stops } : { id: 0, mode, stops, peakHeadway: peak, offPeakHeadway: offPeak });
  }, [state, mode, stops, peak, offPeak]);
  const stopsById = new Map(state.buildings.map(b => [b.id, b]));
  const labelOf = (id: number) => {
    const stop = stopsById.get(id);
    return stop ? `${t(`building.${stop.type}`)} #${id} (${stop.x}, ${stop.y})` : `#${id}`;
  };
  const candidates = state.buildings.filter(b => b.type === STOP_TYPE[mode] && !stops.includes(b.id));
  const canSave = stops.length >= 2 && !failure && citizens >= unlockOf(mode);

  const changeMode = (next: TransitMode) => {
    setMode(next);
    setStops([]);
    setPeak(DEFAULT_PEAK_HEADWAY);
    setOffPeak(DEFAULT_OFF_PEAK_HEADWAY);
  };
  const save = () => {
    const store = gameStore.getState();
    const id = lineId ?? store.state.nextId;
    store.send(mode === 'bus'
      ? { type: 'SetBusLine', id: lineId, stops }
      : { type: 'SetTransitLine', id: lineId, mode, stops, peakHeadway: peak, offPeakHeadway: offPeak });
    if (!gameStore.getState().lastError) onSaved(id);
  };
  const remove = () => {
    if (lineId === undefined) return;
    gameStore.getState().send({ type: mode === 'bus' ? 'DeleteBusLine' : 'DeleteTransitLine', id: lineId });
    onDeleted();
  };

  return <div className="transit-editor-body">
    <h4>{t(lineId === undefined ? 'eco.newLine' : 'eco.editLine')}{lineId !== undefined && ` #${lineId}`}</h4>
    {summary && <LineMetrics line={summary} />}
    <RadioChipGroup
      label={t('transit.lineMode')}
      className="transit-mode-group"
      chipClassName="eco-tab"
      value={mode}
      disabled={lineId !== undefined}
      onChange={changeMode}
      options={TRANSIT_MODES.map(value => ({
        value,
        label: value === 'bus' ? t(MODE_LABEL[value]) : `${t(MODE_LABEL[value])} · ${TRANSIT[value].unlock} 👥`,
        disabled: citizens < unlockOf(value),
      }))}
    />
    <p>{t('eco.lineHelp')}</p>
    <StopList stops={stops} labelOf={labelOf} onChange={setStops} />
    <Dropdown
      className="dropdown--fill"
      label={t('transit.addStop')}
      placeholder={t('transit.addStop')}
      disabled={!candidates.length}
      options={candidates.map(b => ({ value: b.id, label: labelOf(b.id) }))}
      onChange={id => setStops(current => [...current, id])}
    />
    {mode !== 'bus' && <>
      <NumberStepper label={t('transit.peak')} min={HEADWAY_LIMITS[mode].peak[0]} max={HEADWAY_LIMITS[mode].peak[1]} value={peak} onChange={setPeak} />
      <NumberStepper label={t('transit.offPeak')} min={HEADWAY_LIMITS[mode].offPeak[0]} max={HEADWAY_LIMITS[mode].offPeak[1]} value={offPeak} onChange={setOffPeak} />
    </>}
    {failure && <p className="transit-error" role="alert">{t(routeFailureKey(failure))}</p>}
    <div className="transit-actions">
      <ActionButton variant="primary" disabled={!canSave} onClick={save}>{t('eco.saveLine')}</ActionButton>
      {lineId !== undefined && <ActionButton variant="danger" onClick={remove}>{t('eco.deleteLine')}</ActionButton>}
      <ActionButton onClick={onCancel}>{t('pad.cancel')}</ActionButton>
    </div>
  </div>;
}
