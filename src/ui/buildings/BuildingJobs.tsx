import { jobsOf, workplaceTypes, type Building } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';
import { useFilledJobs } from './useFilledJobs';

// At most one decimal, none when the figure is whole.
const oneDecimal = (value: number): number => Math.round(value * 10) / 10;

interface BuildingJobsProps {
  building: Building;
}

export function BuildingJobs({ building }: BuildingJobsProps) {
  const filled = useFilledJobs(building);
  if (!workplaceTypes.includes(building.type)) return null;
  return <DrawerPanel><DrawerPanel.LabelValue label={t('panel.jobs')} value={`${oneDecimal(filled)} / ${jobsOf(building)}`} /></DrawerPanel>;
}
