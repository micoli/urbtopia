import { FIXTURES, floorBonusOfBuilding, floorLinksOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { formatPercent } from './formatPercent';
import { UrbsStat } from '../common/UrbsStat';

interface FloorStatsProps {
  factory: Building;
}

// What sits at the top of the main menu of a Factory floor: the Urbs, the Machines that are linked and the bonus they bring.
export function FloorStats({ factory }: FloorStatsProps) {
  const fixtures = factory.floor?.fixtures ?? [];
  const machines = fixtures.filter(fixture => FIXTURES[fixture.type].role === 'machine').length;
  const linked = floorLinksOf(fixtures).linked.size;
  const bonus = floorBonusOfBuilding(factory);
  return (
    <>
      <UrbsStat />
      <div className="dock-stat" title={t('factory.floor.linked')}>
        <span className="dock-stat-value">{linked} / {machines}</span>
        <span className="dock-stat-label">{t('factory.floor.linked')}</span>
      </div>
      <div className="dock-stat" title={t('factory.floor.speed')}>
        <span className="dock-stat-value">{formatPercent(bonus.speed)}</span>
        <span className="dock-stat-label">{t('factory.floor.speed')}</span>
      </div>
      <div className="dock-stat" title={t('factory.floor.yield')}>
        <span className="dock-stat-value">{formatPercent(bonus.yield)}</span>
        <span className="dock-stat-label">{t('factory.floor.yield')}</span>
      </div>
      <div className="dock-stat" title={t('factory.floor.power')}>
        <span className="dock-stat-value">{bonus.power.toFixed(1)}</span>
        <span className="dock-stat-label">{t('factory.floor.power')}</span>
      </div>
    </>
  );
}
