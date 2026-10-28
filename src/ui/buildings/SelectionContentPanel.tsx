import { EcologicalBuildingPanel } from './EcologicalBuildingPanel';
import { DecorationRotation } from './DecorationRotation';
import { FrontRotation } from './FrontRotation';
import { CoalPlantPanel } from './CoalPlantPanel';
import { StopNameField } from './StopNameField';
import { GAME_CONFIG, greenProfileOf, natureModelOf, isFacilityType, placementCost, canHaveSolarPanels, isRepaintableType, isUtilityType, isTransitStopType, kindOf, hasTrips } from '../../core';
import { t } from '../../i18n/t';
import { FacilityPanel } from './FacilityPanel';
import { TownHallPanel } from '../politics/TownHallPanel';
import { BuildingAccess } from './BuildingAccess';
import { BuildingJobs } from './BuildingJobs';
import { SolarPanelsRow } from './SolarPanelsRow';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { useUi } from '../common/hooks';
import { PANEL_BY_KIND } from './panelsByKind';
import { useSelectedBuilding } from './useSelectedBuilding';
import { UtilityPanel } from './UtilityPanel';
import {UrbsAmount} from "../common/UrbsAmount.tsx";
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { PanelHeader } from '../common/PanelHeader';
import { CodexLinks } from './CodexLinks';
import {RepaintRow} from "./RepaintRow.tsx";

export function SelectionContentPanel() {
  const building = useSelectedBuilding();
  const select = useUi((store) => store.select);
  const moveSelected = useUi((store) => store.moveSelected);
  const sellSelected = useUi((store) => store.sellSelected);
  const showBuildingFlows = useUi((store) => store.showBuildingFlows);
  const debug = useStore(prefsStore, (store) => store.debug);
  if (!building) return null;

  const kind = kindOf(building.type);
  const KindPanel = kind ? PANEL_BY_KIND[kind] : undefined;
  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return (
    <>
      <PanelHeader title={t(`building.${building.type}`)} subtitle={building.tier} onClose={() => select(null)} />
      {debug ? <p className="debug-position">{t('panel.debugPosition')} <code>X {building.x} · Y {building.y}</code></p> : null}
      <BuildingAccess building={building} />
      <BuildingJobs building={building} />
      {isTransitStopType(building.type) ? <StopNameField building={building} /> : null}
      {KindPanel ? <KindPanel building={building} /> : null}
      {isFacilityType(building.type) ? <FacilityPanel building={{ ...building, type: building.type }} /> : null}
      {building.type === 'townHall' ? <TownHallPanel building={building} /> : null}
      {isUtilityType(building.type) ? <UtilityPanel building={building} type={building.type} /> : null}
      {building.type === 'coalPlant' ? <CoalPlantPanel building={building} /> : null}
      {greenProfileOf(building.type) || ['solar','battery','backup'].includes(building.type) || isTransitStopType(building.type) || building.solar ? <EcologicalBuildingPanel building={building} /> : null}
      {canHaveSolarPanels(building.type) ? <SolarPanelsRow building={building} /> : null}
      {natureModelOf(building.type)?.[2] === 'decoration' ? <DecorationRotation building={building} /> : null}
      <FrontRotation building={building} />
      {isRepaintableType(building.type) ? <RepaintRow building={building}/> : null}
      <ButtonRow align="stretch" spaced className="side-panel-actions">
        <ActionButton onClick={moveSelected}>
          ✥ {t('panel.move')}
        </ActionButton>
        {hasTrips(building) ? <ActionButton onClick={() => showBuildingFlows(building.id)}>🚶 {t('panel.flows')}</ActionButton> : null}
        <CodexLinks building={building} />
        <ActionButton onClick={sellSelected}>
          ❌ {t('panel.sell')} · +<UrbsAmount value={refund}/>
        </ActionButton>
      </ButtonRow>
    </>
  );
}
