import { useMemo } from 'react';
import { comfortBonusOf, comfortOf, interiorFixturesOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';

interface HomeComfortProps {
  building: Building;
}

// The Comfort of a Home interior and the Well-being it adds, in the panel of the Home.
export function HomeComfort({ building }: HomeComfortProps) {
  const { comfort, bonus } = useMemo(() => ({ comfort: comfortOf(interiorFixturesOf(building)), bonus: comfortBonusOf({ tier: building.tier, interior: building.interior }) }), [building.tier, building.interior]);
  return <DrawerPanel.LabelValue label={t('home.interior.comfort')} value={<>{comfort} / 100 · +{bonus.toFixed(1)} {t('home.interior.wellbeingShort')}</>} />;
}
