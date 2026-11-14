import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { Icon } from '../common/Icon';
import { UrbsStat } from '../common/UrbsStat';
import { useInteriorIndicators } from './useInteriorIndicators';

interface InteriorStatsProps {
  factory: Building;
}

// What sits at the top of the main menu of a Factory interior: the Urbs, then in one box the Machines that are linked, the levers the building has and the power the Motors draw.
export function InteriorStats({ factory }: InteriorStatsProps) {
  const { machines, linked, power, effects } = useInteriorIndicators(factory);
  return (
    <>
      <UrbsStat />
      <div className="dock-stat dock-stat--rates">
        <span className="dock-rate" title={t('factory.interior.linked')}>
          <Icon name="production" />
          {linked} / {machines}
        </span>
        {effects.map(effect => (
          <span key={effect.id} className="dock-rate" title={t(effect.label)}>
            <Icon name={effect.icon} />
            {effect.value}
          </span>
        ))}
        <span className="dock-rate" title={t('factory.interior.power')}>
          <Icon name="power" />
          {power.toFixed(1)}
        </span>
      </div>
    </>
  );
}
