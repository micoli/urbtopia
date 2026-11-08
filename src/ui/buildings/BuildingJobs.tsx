import { isVenueType, jobsOf, postsAtTier, workplaceTypes, type Building, type VenueType } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';
import { useFilledJobs } from './useFilledJobs';
import { useJobModes } from './useJobModes';

// At most one decimal, none when the figure is whole.
const oneDecimal = (value: number): number => Math.round(value * 10) / 10;

interface BuildingJobsProps {
  building: Building;
}

export function BuildingJobs({ building }: BuildingJobsProps) {
  const filled = useFilledJobs(building);
  const modes = useJobModes(building);
  if (!workplaceTypes.includes(building.type)) return null;
  const venueType = isVenueType(building.type) ? (building.type as VenueType) : null;
  const hired = jobsOf(building);
  return (
    <DrawerPanel>
      <DrawerPanel.LabelValue label={t('panel.jobs')} value={`${oneDecimal(filled)} / ${jobsOf(building)}`} />
      {venueType && (
        <p>{t('panel.venueStaffJobs').replace('{hired}', String(hired)).replace('{filled}', String(oneDecimal(filled))).replace('{posts}', String(postsAtTier(venueType, building.tier)))}</p>
      )}
      {venueType && hired > 0 && filled < hired && <p>{t('panel.venueFillRate').replace('{rate}', String(Math.round((filled / hired) * 100)))}</p>}
      {modes && filled > 0 && <p>{t('panel.jobsModes').replace('{walking}', String(Math.round(modes.walking))).replace('{cycling}', String(Math.round(modes.cycling))).replace('{transit}', String(Math.round(modes.transit))).replace('{car}', String(Math.round(modes.car)))}</p>}
    </DrawerPanel>
  );
}
