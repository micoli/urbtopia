import type { Building } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { IconButton } from '../../../common/IconButton.tsx';
import { Icon } from '../../../common/Icon';
import { CoordinatesLink } from '../../../common/CoordinatesLink.tsx';

interface StopRowProps {
  position: number;
  label: string;
  building?: Building;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function StopRow({ position, label, building, isFirst, isLast, onMoveUp, onMoveDown, onRemove }: StopRowProps) {
  return <li className="transit-stop">
    <span className="transit-stop-index">{position}</span>
    <span className="transit-stop-label">{label}{building && <> <CoordinatesLink x={building.x} y={building.y} /></>}</span>
    <IconButton label={t('transit.moveUp')} disabled={isFirst} onClick={onMoveUp}><Icon name="arrowUp" /></IconButton>
    <IconButton label={t('transit.moveDown')} disabled={isLast} onClick={onMoveDown}><Icon name="arrowDown" /></IconButton>
    <IconButton label={t('transit.removeStop')} tone="danger" onClick={onRemove}><Icon name="close" /></IconButton>
  </li>;
}
