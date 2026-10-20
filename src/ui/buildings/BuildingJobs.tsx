import { jobsOf, workplaceTypes, type Building } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';
import { useFilledJobs } from './useFilledJobs';

interface BuildingJobsProps {
  building: Building;
}

export function BuildingJobs({ building }: BuildingJobsProps) {
  const filled = useFilledJobs(building);
  if (!workplaceTypes.includes(building.type)) return null;
  return <DrawerPanel><DrawerPanel.LabelValue label={t('panel.jobs')} value={`${filled} / ${jobsOf(building)}`} /></DrawerPanel>;
}
