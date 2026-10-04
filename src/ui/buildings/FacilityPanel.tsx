import { FACILITIES, citizensOf, facilityCapacity, serviceCoverage, type Building, type FacilityType } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { ReachToggle } from '../common/ReachToggle.tsx';
import { UpgradeSection } from '../common/UpgradeSection.tsx';
import {DrawerPanelTitle} from "../common/DrawerPanelTitle.tsx";
import {DrawerPanelLabelValue} from "../common/DrawerPanelLabelValue.tsx";
import {DrawerProductionPanel} from "../common/DrawerProductionPanel.tsx";

interface FacilityPanelProps {
  building: Building & { type: FacilityType };
}

export function FacilityPanel({ building }: FacilityPanelProps) {
  const state = useGame(s => s.state);
  const { radius } = FACILITIES[building.type];
  const capacity = facilityCapacity(building.type, building.tier);
  const coverage = serviceCoverage(state);
  const served = state.buildings.reduce((total, home) => total + (home.type === 'home' && coverage.get(home.id)?.has(building.type) ? citizensOf(home.tier) : 0), 0);
  return <DrawerProductionPanel>
        <DrawerPanelTitle title={t(`home.tier`)} level={building.tier}/>
        <DrawerPanelLabelValue label={t('facility.reach')} value={radius === null ? t('placement.cityWide') : `${2 * radius} × ${2 * radius}`}/>
        {radius !== null && <ReachToggle />}
        <DrawerPanelLabelValue label={t('facility.capacity')} value={`${capacity === null ? t('facility.unlimited') : capacity} · ${t('facility.served')}: ${served}`}/>
      <UpgradeSection building={building} />
  </DrawerProductionPanel>
}
