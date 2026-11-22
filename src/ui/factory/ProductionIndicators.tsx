import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { useInteriorIndicators } from './useInteriorIndicators';

interface ProductionIndicatorsProps {
  factory: Building;
}

export function ProductionIndicators({ factory }: ProductionIndicatorsProps) {
  const { machines, linked, power, circuits, effects } = useInteriorIndicators(factory);
  return (
    <LabeledList>
      {circuits === undefined ? <LabeledList.Row label={t('factory.interior.linked')}>{linked} / {machines}</LabeledList.Row> : <LabeledList.Row label={t('factory.interior.circuits')}>{circuits}</LabeledList.Row>}
      {effects.map(effect => <LabeledList.Row key={effect.id} label={t(effect.label)}>{effect.value}</LabeledList.Row>)}
      {circuits === undefined ? <LabeledList.Row label={t('factory.interior.power')}>{power.toFixed(1)}</LabeledList.Row> : null}
    </LabeledList>
  );
}
