import { useMemo } from 'react';
import { serviceFurnitureQuality, type Building } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { formatPercent } from './formatPercent';

interface ServiceIndicatorsProps {
  building: Building;
}

export function ServiceIndicators({ building }: ServiceIndicatorsProps) {
  const quality = useMemo(() => serviceFurnitureQuality(building), [building.type, building.tier, building.interior]);
  return (
    <LabeledList>
      <LabeledList.Row label={t('service.interior.quality')}>{formatPercent(quality)}</LabeledList.Row>
    </LabeledList>
  );
}
