import { CollectBadges } from '../collect/CollectBadges';
import { GatheringBadges } from '../tourism/GatheringBadges';
import { SanctionBadges } from '../sanction/SanctionBadges';
import { WorkingIndicators } from '../common/WorkingIndicators';
import { ParcelTags } from '../parcels/ParcelTags';
import { LocatorArrow } from '../buildings/LocatorArrow';
import { useGame, useShowcase, useUi } from '../common/hooks';

export function FloatingBadges() {
  const heatmapOpen = useUi(store => store.serviceCoverageOpen);
  const visiting = useShowcase(store => store.visit.kind === 'visiting');
  const replanning = useGame(store => store.state.replan !== undefined);
  if (heatmapOpen || visiting || replanning) return null;

  return <>
    <WorkingIndicators />
    <CollectBadges />
    <GatheringBadges />
    <SanctionBadges />
    <ParcelTags />
    <LocatorArrow />
  </>;
}
