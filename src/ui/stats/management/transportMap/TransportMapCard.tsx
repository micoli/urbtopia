import { t } from '../../../../i18n/t.ts';
import { LabeledList } from '../../../common/LabeledList.tsx';
import { formatHeadway } from '../transit/formatHeadway.ts';
import { MODE_LABEL } from '../transit/lineModels.ts';
import { lineStatusKey } from '../transit/lineStatusKey.ts';
import type { MapSelection } from './selection.ts';
import type { TransportMapModel } from './transportMapModel.ts';

export function TransportMapCard({ model, selection }: { model: TransportMapModel; selection: MapSelection }) {
  if (selection === null) return <p className="transport-map-hint">{t('transportMap.hint')}</p>;
  if (selection.kind === 'line') {
    const line = model.lines.find(candidate => candidate.id === selection.id);
    if (!line) return null;
    return <div className="transport-map-card" role="region" aria-label={`${t(MODE_LABEL[line.mode])} #${line.id}`}>
      <h4>{t(MODE_LABEL[line.mode])} #{line.id}{line.loop && ` · ${t('transit.loopLine')}`}</h4>
      <LabeledList>
        <LabeledList.Row label={t('transit.status')}>{t(lineStatusKey(line.status))}</LabeledList.Row>
        <LabeledList.Row label={t('transportMap.pedestrians')}>{(line.riders - line.cyclists).toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('transportMap.cyclists')}>{line.cyclists.toFixed(1)}</LabeledList.Row>
        <LabeledList.Row label={t('transportMap.load')}>{t(`transportMap.level.${line.level}`)} · {(line.load * 100).toFixed(0)}%</LabeledList.Row>
        <LabeledList.Row label={t('transportMap.capacity')}>{line.capacity.toFixed(1)}</LabeledList.Row>
        {line.mode !== 'bus' && <LabeledList.Row label={t('transit.headway')}>{formatHeadway(line.headway)}</LabeledList.Row>}
      </LabeledList>
    </div>;
  }
  const node = model.nodes.find(candidate => candidate.id === selection.id);
  if (!node) return null;
  const lines = model.lines.filter(line => line.stops.includes(node.id));
  return <div className="transport-map-card" role="region" aria-label={node.label}>
    <h4>{node.label}</h4>
    <LabeledList>
      <LabeledList.Row label={t('transit.lines')}>{lines.map(line => `${t(MODE_LABEL[line.mode])} #${line.id}`).join(' · ') || '–'}</LabeledList.Row>
      {node.carriesBikes && <LabeledList.Row label={t('transportMap.bikes')}>{t('transportMap.bikesCarried')}</LabeledList.Row>}
    </LabeledList>
  </div>;
}
