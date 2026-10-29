import {
    canHaveSolarPanels,
    isRepaintableType,
    natureModelOf,
    type Building,
    placementCost,
    GAME_CONFIG
} from '../../core';
import { t } from '../../i18n/t';
import { UpgradeSection } from '../common/UpgradeSection';
import { DecorationRotation } from './DecorationRotation';
import { FrontRotation } from './FrontRotation';
import { PanelSection } from './PanelSection';
import { RepaintRow } from './RepaintRow';
import { SolarPanelsRow } from './SolarPanelsRow';
import {ActionButton} from "../common/ActionButton.tsx";
import {Icon} from "../common/Icon.tsx";
import {UrbsAmount} from "../common/UrbsAmount.tsx";
import {useUi} from "../common/hooks.ts";

export function BuildingModifications({ building }: { building: Building }) {
  const sellSelected = useUi((store) => store.sellSelected);
  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return (
    <PanelSection id="modifications" title={t('panel.section.modifications')}>
      {natureModelOf(building.type)?.[2] === 'decoration' ? <DecorationRotation building={building} /> : null}
      <FrontRotation building={building} />
      {isRepaintableType(building.type) ? <RepaintRow building={building} /> : null}
      {canHaveSolarPanels(building.type) ? <SolarPanelsRow building={building} /> : null}
      <UpgradeSection building={building} />
      <ActionButton onClick={sellSelected}>
        <Icon name="trash" /> {t('panel.sell')} +<UrbsAmount value={refund} />
      </ActionButton>
    </PanelSection>
  );
}
