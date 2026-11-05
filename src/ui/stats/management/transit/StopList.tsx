import type { Building } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { moveItem } from './moveItem.ts';
import { StopRow } from './StopRow.tsx';

interface StopListProps {
  stops: readonly number[];
  titleOf: (stopId: number) => string;
  buildingOf: (stopId: number) => Building | undefined;
  onChange: (stops: number[]) => void;
}

export function StopList({ stops, titleOf, buildingOf, onChange }: StopListProps) {
  if (!stops.length) return <p>{t('transit.noStops')}</p>;
  return <ol className="transit-stop-list" aria-label={t('eco.selectedStops')}>
    {stops.map((stopId, index) => <StopRow
      key={stopId}
      position={index + 1}
      label={titleOf(stopId)}
      building={buildingOf(stopId)}
      isFirst={index === 0}
      isLast={index === stops.length - 1}
      onMoveUp={() => onChange(moveItem(stops, index, -1))}
      onMoveDown={() => onChange(moveItem(stops, index, 1))}
      onRemove={() => onChange(stops.filter(id => id !== stopId))}
    />)}
  </ol>;
}
