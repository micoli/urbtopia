import { greenProfileOf, isFacilityType, isTransitStopType, isUtilityType, kindOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { TownHallPanel } from '../politics/TownHallPanel';
import { BuildingAccess } from './BuildingAccess';
import { BuildingJobs } from './BuildingJobs';
import { CoalPlantPanel } from './CoalPlantPanel';
import { EcologicalBuildingPanel } from './EcologicalBuildingPanel';
import { FacilityPanel } from './FacilityPanel';
import { PanelSection } from './PanelSection';
import { PANEL_BY_KIND } from './panelsByKind';
import { StopLineButtons } from './StopLineButtons';
import { StopNameField } from './StopNameField';
import { UtilityPanel } from './UtilityPanel';

export function BuildingUsage({ building }: { building: Building }) {
  const kind = kindOf(building.type);
  const KindPanel = kind ? PANEL_BY_KIND[kind] : undefined;
  const isEcologicalBuilding = greenProfileOf(building.type) || ['solar', 'battery', 'backup'].includes(building.type) || isTransitStopType(building.type) || building.solar;
  return (
    <PanelSection id="usage" title={t('panel.section.usage')}>
      <BuildingAccess building={building} />
      <BuildingJobs building={building} />
      {isTransitStopType(building.type) ? <StopNameField building={building} /> : null}
      {isTransitStopType(building.type) ? <StopLineButtons building={building} /> : null}
      {isEcologicalBuilding ? <EcologicalBuildingPanel building={building} /> : null}
      {KindPanel ? <KindPanel building={building} /> : null}
      {isFacilityType(building.type) ? <FacilityPanel building={{ ...building, type: building.type }} /> : null}
      {building.type === 'townHall' ? <TownHallPanel building={building} /> : null}
      {isUtilityType(building.type) ? <UtilityPanel building={building} type={building.type} /> : null}
      {building.type === 'coalPlant' ? <CoalPlantPanel building={building} /> : null}
    </PanelSection>
  );
}
