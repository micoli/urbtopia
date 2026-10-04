import { t } from '../../../../i18n/t.ts';
import { LineListItem } from './LineListItem.tsx';
import type { LineSummary } from './LineMetrics.tsx';

export type LineSelection = number | 'new' | null;

interface LineListProps {
  lines: readonly LineSummary[];
  selection: LineSelection;
  onSelect: (selection: LineSelection) => void;
}

export function LineList({ lines, selection, onSelect }: LineListProps) {
  return <nav className="transit-line-list" aria-label={t('transit.lines')}>
    {lines.map(line => <LineListItem key={line.id} line={line} selected={selection === line.id} onSelect={() => onSelect(line.id)} />)}
    <button type="button" className="transit-line-item transit-line-new" aria-current={selection === 'new' ? 'true' : undefined} onClick={() => onSelect('new')}>
      <span aria-hidden="true">＋</span>
      <span className="transit-line-name">{t('eco.newLine')}</span>
    </button>
  </nav>;
}
