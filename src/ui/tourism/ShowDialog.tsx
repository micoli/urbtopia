import { useStore } from 'zustand';
import { inGatheringCooldown, isShowType } from '../../core';
import { showDialogStore } from '../../store/showDialogStore';
import { useGame } from '../common/hooks';
import { ShowForm } from './ShowForm';

export function ShowDialog() {
  const buildingId = useStore(showDialogStore, store => store.buildingId);
  const building = useGame(store => (buildingId === null ? undefined : store.state.buildings.find(candidate => candidate.id === buildingId)));
  const now = useGame(store => store.state.lastSeen);
  if (!building || !isShowType(building.type)) return null;
  if (building.attraction?.gathering || inGatheringCooldown(building, now)) return null;
  return <ShowForm key={building.id} building={building} />;
}
