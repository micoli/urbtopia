import { t } from '../../../../i18n/t.ts';
import { IconButton } from '../../../common/IconButton.tsx';
import { Icon } from '../../../common/Icon';

interface StopRowProps {
  position: number;
  label: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function StopRow({ position, label, isFirst, isLast, onMoveUp, onMoveDown, onRemove }: StopRowProps) {
  return <li className="transit-stop">
    <span className="transit-stop-index">{position}</span>
    <span className="transit-stop-label">{label}</span>
    <IconButton label={t('transit.moveUp')} disabled={isFirst} onClick={onMoveUp}><Icon name="arrowUp" /></IconButton>
    <IconButton label={t('transit.moveDown')} disabled={isLast} onClick={onMoveDown}><Icon name="arrowDown" /></IconButton>
    <IconButton label={t('transit.removeStop')} tone="danger" onClick={onRemove}><Icon name="close" /></IconButton>
  </li>;
}
