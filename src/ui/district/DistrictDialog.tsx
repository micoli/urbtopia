import { useStore } from 'zustand';
import { isPlanningOffice } from '../../core';
import { districtStore } from '../../store/districtStore';
import { useGame } from '../common/hooks';
import { DistrictScreen } from './DistrictScreen';

export function DistrictDialog() {
  const officeId = useStore(districtStore, store => store.officeId);
  const building = useGame(store => (officeId === null ? undefined : store.state.buildings.find(candidate => candidate.id === officeId)));
  if (!building || !isPlanningOffice(building)) return null;
  return <DistrictScreen building={building} />;
}
