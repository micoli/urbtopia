import { useMemo, useState } from 'react';
import type { CongestionStats, GameState, TransitMode, transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { CheckboxField } from '../../../common/CheckboxField.tsx';
import { SectionHeading } from '../../../common/SectionHeading.tsx';
import { ModeMix } from '../ModeMix.tsx';
import { MODE_LABEL, TRANSIT_MODES } from '../transit/lineModels.ts';
import type { MapSelection } from './selection.ts';
import { TransportMapCanvas } from './TransportMapCanvas.tsx';
import { TransportMapCard } from './TransportMapCard.tsx';
import { buildTransportMap, visibleLines } from './transportMapModel.ts';

interface TransportMapSectionProps {
  state: GameState;
  transport: ReturnType<typeof transportStats>;
  congestion: CongestionStats;
}

export function TransportMapSection({ state, transport, congestion }: TransportMapSectionProps) {
  const [modes, setModes] = useState<ReadonlySet<TransitMode>>(() => new Set(TRANSIT_MODES));
  const [selection, setSelection] = useState<MapSelection>(null);
  const model = useMemo(() => buildTransportMap(state, transport), [state, transport]);
  const lines = visibleLines(model, modes);
  const toggle = (mode: TransitMode, on: boolean) => setModes(current => {
    const next = new Set(current);
    if (on) next.add(mode); else next.delete(mode);
    return next;
  });
  return <section id="eco-transportMap" className="eco-wide">
    <SectionHeading icon="🗺️">{t('eco.transportMap')}</SectionHeading>
    <p>{t('transportMap.help')}</p>
    <ModeMix congestion={congestion} />
    {model.lines.length === 0
      ? <p>{t('transportMap.empty')}</p>
      : <>
        <div className="transport-map-filters" role="group" aria-label={t('transportMap.filters')}>
          {TRANSIT_MODES.map(mode => <CheckboxField key={mode} label={t(MODE_LABEL[mode])} checked={modes.has(mode)} onChange={on => toggle(mode, on)} />)}
        </div>
        <TransportMapCanvas model={model} lines={lines} selection={selection} onSelect={setSelection} />
        <TransportMapCard model={model} selection={selection} />
      </>}
  </section>;
}
