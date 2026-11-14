import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { formatPercent } from './formatPercent';
import { useInteriorIndicators } from './useInteriorIndicators';

interface ProductionIndicatorsProps {
  factory: Building;
}

export function ProductionIndicators({ factory }: ProductionIndicatorsProps) {
  const { machines, linked, speed, yield: yieldBonus, power } = useInteriorIndicators(factory);
  return (
    <LabeledList>
      <LabeledList.Row label={t('factory.interior.linked')}>{linked} / {machines}</LabeledList.Row>
      <LabeledList.Row label={t('factory.interior.speed')}>{formatPercent(speed)}</LabeledList.Row>
      <LabeledList.Row label={t('factory.interior.yield')}>{formatPercent(yieldBonus)}</LabeledList.Row>
      <LabeledList.Row label={t('factory.interior.power')}>{power.toFixed(1)}</LabeledList.Row>
    </LabeledList>
  );
}
