import { FACILITIES, WASTE_FACILITIES, cityKnowledge, citizensOf, facilityCapacity, facilityRadius, reachLoad, serviceCoverage, wasteKindOf, type Building, type FacilityType, isHomeType } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { ReachToggle } from '../common/ReachToggle.tsx';
import { BlockedReason } from '../common/BlockedReason';
import { DrawerPanel } from '../common/DrawerPanel';
import { WasteCapacityRows } from './WasteCapacityRows';

interface FacilityPanelProps {
  building: Building & { type: FacilityType };
}

export function FacilityPanel({ building }: FacilityPanelProps) {
  const state = useGame(s => s.state);
  const radius = facilityRadius(building.type, building.tier);
  const capacity = facilityCapacity(building.type, building.tier);
  const coverage = serviceCoverage(state);
  const isWaste = FACILITIES[building.type].category === 'waste';
  const wasteKind = wasteKindOf(building.type);
  const hasNuisance = wasteKind !== null && (WASTE_FACILITIES[wasteKind].odor !== null || WASTE_FACILITIES[wasteKind].pollution !== null);
  const served = state.buildings.reduce((total, home) => total + (isHomeType(home.type) && coverage.get(home.id)?.has(building.type) ? citizensOf(home.tier) : 0), 0);
  const load = isWaste ? null : reachLoad(state, building);
  const knowledge = FACILITIES[building.type].category === 'education' ? cityKnowledge(state) : null;
  return <DrawerPanel>
        {wasteKind
          ? <DrawerPanel.LabelValue label={t('facility.collectionDistance')} value={WASTE_FACILITIES[wasteKind].collectionDistance}/>
          : <DrawerPanel.LabelValue label={t('facility.reach')} value={radius === null ? t('placement.cityWide') : `${2 * radius} × ${2 * radius}`}/>}
        {(radius !== null || hasNuisance) && <ReachToggle />}
        {isWaste
          ? <WasteCapacityRows facilityId={building.id}/>
          : <DrawerPanel.LabelValue label={t('facility.capacity')} value={`${capacity === null ? t('facility.unlimited') : capacity} · ${t('facility.served')}: ${served}`}/>}
        {knowledge !== null && <DrawerPanel.LabelValue label={t('facility.knowledge')} value={Math.round(knowledge)}/>}
        {load && <DrawerPanel.LabelValue label={t('facility.inReach')} value={load.citizensInReach}/>}
        {load && load.unservedCitizens > 0 && <DrawerPanel.LabelValue tone="warn" label={t('facility.unserved')} value={`${load.unservedCitizens} (${load.unservedHomes})`}/>}
        {load && load.unservedCitizens > 0 && <BlockedReason reason={t('facility.overloadedHint')} />}
  </DrawerPanel>
}
