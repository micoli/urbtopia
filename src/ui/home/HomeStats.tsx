import { useMemo } from 'react';
import { comfortBonusOf, comfortOf, interiorFixturesOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { UrbsStat } from '../common/UrbsStat';

interface HomeStatsProps {
  home: Building;
}

// What sits at the top of the main menu of a Home interior: the Urbs, the Comfort and the Well-being it adds.
export function HomeStats({ home }: HomeStatsProps) {
  const { comfort, bonus } = useMemo(() => ({ comfort: comfortOf(interiorFixturesOf(home)), bonus: comfortBonusOf({ tier: home.tier, interior: home.interior }) }), [home.tier, home.interior]);
  return (
    <>
      <UrbsStat />
      <div className="dock-stat" title={t('home.interior.comfort')}>
        <span className="dock-stat-value">{comfort} %</span>
        <span className="dock-stat-label">{t('home.interior.comfort')}</span>
      </div>
      <div className="dock-stat" title={t('home.interior.wellbeing')}>
        <span className="dock-stat-value">+{bonus.toFixed(1)}</span>
        <span className="dock-stat-label">{t('home.interior.wellbeing')}</span>
      </div>
    </>
  );
}
