import { t } from '../../../../i18n/t.ts';
import { MODE_ICON, MODE_LABEL } from './lineModels.ts';
import { lineStatusKey } from './lineStatusKey.ts';
import { isSlowedByTraffic, speedPercent } from './lineSpeed.ts';
import type { LineSummary } from './LineMetrics.tsx';
import { Icon } from '../../../common/Icon';

interface LineListItemProps {
  line: LineSummary;
  selected: boolean;
  onSelect: () => void;
}

export function LineListItem({ line, selected, onSelect }: LineListItemProps) {
  return <button type="button" className="transit-line-item" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
    <Icon name={MODE_ICON[line.mode]} />
    <span className="transit-line-name">{t(MODE_LABEL[line.mode])} #{line.id}</span>
    {line.loop && <span className="transit-line-loop" role="img" aria-label={t('transit.loopLine')} title={t('transit.loopLine')}><Icon name="loop" /></span>}
    {isSlowedByTraffic(line) && <span className="transit-line-speed" title={t('transit.slowedByTraffic')}><Icon name="slow" /> {speedPercent(line)}%</span>}
    <span className="transit-status-dot" data-status={line.status} role="img" aria-label={t(lineStatusKey(line.status))} />
  </button>;
}
