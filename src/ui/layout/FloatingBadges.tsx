import { CollectBadges } from '../collect/CollectBadges';
import { SanctionBadges } from '../sanction/SanctionBadges';
import { WorkingIndicators } from '../common/WorkingIndicators';
import { ParcelTags } from '../parcels/ParcelTags';
import { useUi } from '../common/hooks';

export function FloatingBadges() {
  const heatmapOpen = useUi(store => store.serviceCoverageOpen);
  if (heatmapOpen) return null;

  return <>
    <WorkingIndicators />
    <CollectBadges />
    <SanctionBadges />
    <ParcelTags />
  </>;
}
