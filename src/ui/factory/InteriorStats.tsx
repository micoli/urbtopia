import { useMemo } from 'react';
import { FIXTURES, interiorBonusOfBuilding, interiorFixturesOf, interiorLinksOf, interiorPowerOfBuilding, type Building } from '../../core';
import { t } from '../../i18n/t';
import { formatPercent } from './formatPercent';
import { UrbsStat } from '../common/UrbsStat';

interface InteriorStatsProps {
  factory: Building;
}

// What sits at the top of the main menu of a Factory interior: the Urbs, the Machines that are linked and the bonus they bring.
export function InteriorStats({ factory }: InteriorStatsProps) {
  const fixtures = interiorFixturesOf(factory);
  const { machines, linked, bonus, power } = useMemo(() => ({
    machines: fixtures.filter(fixture => FIXTURES[fixture.type].role === 'machine').length,
    linked: interiorLinksOf(fixtures).linked.size,
    bonus: interiorBonusOfBuilding({ type: factory.type, tier: factory.tier, interior: factory.interior }),
    power: interiorPowerOfBuilding({ type: factory.type, tier: factory.tier, interior: factory.interior }),
  }), [fixtures, factory.type, factory.tier, factory.interior]);
  return (
    <>
      <UrbsStat />
      <div className="dock-stat" title={t('factory.interior.linked')}>
        <span className="dock-stat-value">{linked} / {machines}</span>
        <span className="dock-stat-label">{t('factory.interior.linked')}</span>
      </div>
      <div className="dock-stat" title={t('factory.interior.speed')}>
        <span className="dock-stat-value">{formatPercent(bonus.speed)}</span>
        <span className="dock-stat-label">{t('factory.interior.speed')}</span>
      </div>
      <div className="dock-stat" title={t('factory.interior.yield')}>
        <span className="dock-stat-value">{formatPercent(bonus.yield)}</span>
        <span className="dock-stat-label">{t('factory.interior.yield')}</span>
      </div>
      <div className="dock-stat" title={t('factory.interior.power')}>
        <span className="dock-stat-value">{power.toFixed(1)}</span>
        <span className="dock-stat-label">{t('factory.interior.power')}</span>
      </div>
    </>
  );
}
