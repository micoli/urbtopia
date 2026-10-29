import { canHaveSolarPanels, isRepaintableType, natureModelOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { UpgradeSection } from '../common/UpgradeSection';
import { DecorationRotation } from './DecorationRotation';
import { FrontRotation } from './FrontRotation';
import { PanelSection } from './PanelSection';
import { RepaintRow } from './RepaintRow';
import { SolarPanelsRow } from './SolarPanelsRow';

export function BuildingModifications({ building }: { building: Building }) {
  return (
    <PanelSection id="modifications" title={t('panel.section.modifications')}>
      {natureModelOf(building.type)?.[2] === 'decoration' ? <DecorationRotation building={building} /> : null}
      <FrontRotation building={building} />
      {isRepaintableType(building.type) ? <RepaintRow building={building} /> : null}
      {canHaveSolarPanels(building.type) ? <SolarPanelsRow building={building} /> : null}
      <UpgradeSection building={building} />
    </PanelSection>
  );
}
