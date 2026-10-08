import { EcologicalBuildingPanel } from './EcologicalBuildingPanel';
import { DecorationRotation } from './DecorationRotation';
import { CoalPlantPanel } from './CoalPlantPanel';
import { GAME_CONFIG, greenProfileOf, natureModelOf, isFacilityType, isStorageType, placementCost } from '../../core';
import { t } from '../../i18n/t';
import { FacilityPanel } from './FacilityPanel';
import { CasinoPanel } from '../casino/CasinoPanel';
import { FarmPanel } from './FarmPanel';
import { BuildingAccess } from './BuildingAccess';
import { HomePanel } from './HomePanel';
import { useUi } from '../common/hooks';
import { ProductionPanel } from './ProductionPanel';
import { ShopPanel } from './ShopPanel';
import { StoragePanel } from './StoragePanel';
import { useSelectedBuilding } from './useSelectedBuilding';
import { UtilityPanel } from './UtilityPanel';
import {UrbsAmount} from "../common/UrbsAmount.tsx";
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { PanelHeader } from '../common/PanelHeader';

export function SelectionContentPanel() {
  const building = useSelectedBuilding();
  const select = useUi((store) => store.select);
  const moveSelected = useUi((store) => store.moveSelected);
  const sellSelected = useUi((store) => store.sellSelected);
  if (!building) return null;

  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return (
    <>
      <PanelHeader title={t(`building.${building.type}`)} subtitle={building.tier} onClose={() => select(null)} />
      <BuildingAccess building={building} />
      {building.type === 'workshop' || building.type === 'factory' || building.type === 'packhouse' ? <ProductionPanel building={building} /> : null}
      {building.type === 'farm' ? <FarmPanel building={building} /> : null}
      {building.type === 'home' ? <HomePanel building={building} /> : null}
      {isFacilityType(building.type) ? <FacilityPanel building={{ ...building, type: building.type }} /> : null}
      {building.type === 'casino' ? <CasinoPanel building={building} /> : null}
      {building.type === 'shop' ? <ShopPanel building={building} /> : null}
      {isStorageType(building.type) ? <StoragePanel building={building} /> : null}
      {building.type === 'powerPlant' || building.type === 'waterTower' ? <UtilityPanel building={building} type={building.type} /> : null}
      {building.type === 'coalPlant' ? <CoalPlantPanel building={building} /> : null}
      {greenProfileOf(building.type) || ['solar','battery','backup','busStop','brtStation','railStation'].includes(building.type) || (building.type === 'home' && building.solar) ? <EcologicalBuildingPanel building={building} /> : null}
      {natureModelOf(building.type)?.[2] === 'decoration' ? <DecorationRotation building={building} /> : null}
      <ButtonRow align="stretch" spaced className="side-panel-actions">
        <ActionButton onClick={moveSelected}>
          ✥ {t('panel.move')}
        </ActionButton>
        <ActionButton onClick={sellSelected}>
          ❌ +<UrbsAmount value={refund}/>
        </ActionButton>
      </ButtonRow>
    </>
  );
}
