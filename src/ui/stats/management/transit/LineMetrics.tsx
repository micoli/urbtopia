import type { transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { LabeledList } from '../../../common/LabeledList.tsx';
import { formatHeadway } from './formatHeadway.ts';
import { LineSpeed } from './LineSpeed.tsx';
import { lineStatusKey } from './lineStatusKey.ts';

export type LineSummary = ReturnType<typeof transportStats>['lines'][number];

export function LineMetrics({ line }: { line: LineSummary }) {
  return <LabeledList>
    <LabeledList.Row label={t('transit.status')}>{t(lineStatusKey(line.status))}</LabeledList.Row>
    <LabeledList.Row label={t('eco.riders')}>{line.riders.toFixed(1)} / {line.capacity.toFixed(1)}</LabeledList.Row>
    {line.mode === 'bus' && line.active && <LabeledList.Row label={t('transit.effectiveSpeed')}><LineSpeed line={line} /></LabeledList.Row>}
    {line.mode !== 'bus' && <>
      <LabeledList.Row label={t('transit.vehicles')}>{line.vehicleCount}</LabeledList.Row>
      <LabeledList.Row label={t('transit.headway')}>{formatHeadway(line.headway)}</LabeledList.Row>
    </>}
  </LabeledList>;
}
