import { t } from '../../../../i18n/t.ts';
import { MODE_ICON, MODE_LABEL } from './lineModels.ts';
import { lineStatusKey } from './lineStatusKey.ts';
import { isSlowedByTraffic, speedPercent } from './lineSpeed.ts';
import type { LineSummary } from './LineMetrics.tsx';

interface LineListItemProps {
  line: LineSummary;
  selected: boolean;
  onSelect: () => void;
}

export function LineListItem({ line, selected, onSelect }: LineListItemProps) {
  return <button type="button" className="transit-line-item" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
    <span aria-hidden="true">{MODE_ICON[line.mode]}</span>
    <span className="transit-line-name">{t(MODE_LABEL[line.mode])} #{line.id}</span>
    {isSlowedByTraffic(line) && <span className="transit-line-speed" title={t('transit.slowedByTraffic')}>🐌 {speedPercent(line)}%</span>}
    <span className="transit-status-dot" data-status={line.status} role="img" aria-label={t(lineStatusKey(line.status))} />
  </button>;
}
