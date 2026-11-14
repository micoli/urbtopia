import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { useInteriorIndicators } from './useInteriorIndicators';

interface ProductionIndicatorsProps {
  factory: Building;
}

export function ProductionIndicators({ factory }: ProductionIndicatorsProps) {
  const { machines, linked, power, effects } = useInteriorIndicators(factory);
  return (
    <LabeledList>
      <LabeledList.Row label={t('factory.interior.linked')}>{linked} / {machines}</LabeledList.Row>
      {effects.map(effect => <LabeledList.Row key={effect.id} label={t(effect.label)}>{effect.value}</LabeledList.Row>)}
      <LabeledList.Row label={t('factory.interior.power')}>{power.toFixed(1)}</LabeledList.Row>
    </LabeledList>
  );
}
