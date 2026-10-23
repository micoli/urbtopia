import { FACILITIES, citizensOf, facilityCapacity, reachLoad, serviceCoverage, wasteCitizensServedBy, type Building, type FacilityType, isHomeType } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { ReachToggle } from '../common/ReachToggle.tsx';
import { BlockedReason } from '../common/BlockedReason';
import { DrawerPanel } from '../common/DrawerPanel';

interface FacilityPanelProps {
  building: Building & { type: FacilityType };
}

export function FacilityPanel({ building }: FacilityPanelProps) {
  const state = useGame(s => s.state);
  const { radius } = FACILITIES[building.type];
  const capacity = facilityCapacity(building.type, building.tier);
  const coverage = serviceCoverage(state);
  const isWaste = FACILITIES[building.type].category === 'waste';
  const served = isWaste
    ? wasteCitizensServedBy(state, building.id)
    : state.buildings.reduce((total, home) => total + (isHomeType(home.type) && coverage.get(home.id)?.has(building.type) ? citizensOf(home.tier) : 0), 0);
  const load = isWaste ? null : reachLoad(state, building);
  return <DrawerPanel>
        <DrawerPanel.LabelValue label={t('facility.reach')} value={radius === null ? t('placement.cityWide') : `${2 * radius} × ${2 * radius}`}/>
        {radius !== null && <ReachToggle />}
        <DrawerPanel.LabelValue label={t(isWaste ? 'facility.wasteCapacity' : 'facility.capacity')} value={`${capacity === null ? t('facility.unlimited') : capacity} · ${t('facility.served')}: ${served}`}/>
        {load && <DrawerPanel.LabelValue label={t('facility.inReach')} value={load.citizensInReach}/>}
        {load && load.unservedCitizens > 0 && <DrawerPanel.LabelValue tone="warn" label={t('facility.unserved')} value={`${load.unservedCitizens} (${load.unservedHomes})`}/>}
        {load && load.unservedCitizens > 0 && <BlockedReason reason={t('facility.overloadedHint')} />}
      <DrawerPanel.Upgrade building={building} />
  </DrawerPanel>
}
