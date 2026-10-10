import { reputationOf, type VenuePerformance, type VenueData } from '../../core';
import { t } from '../../i18n/t';
import { DrawerPanel } from '../common/DrawerPanel';

interface VenueHotelStatsProps {
  venue: VenueData;
  performance: VenuePerformance;
}

const percent = (value: number): string => `${Math.round(value * 100)} %`;

export function VenueHotelStats({ venue, performance }: VenueHotelStatsProps) {
  const { rooms } = performance;
  if (!rooms) return null;
  return (
    <>
      <DrawerPanel.LabelValue label={t('venue.reputation')} value={`${Math.round(reputationOf(venue))} / 100`} />
      <DrawerPanel.LabelValue label={t('venue.rooms')} value={`${rooms.valid} / ${rooms.rooms}`} />
      <DrawerPanel.LabelValue label={t('venue.roomsOccupied')} value={rooms.occupied.toFixed(1)} />
      <DrawerPanel.LabelValue label={t('venue.standing')} value={rooms.standing.toFixed(1)} />
      <DrawerPanel.LabelValue label={t('venue.cleanliness')} value={percent(rooms.cleanliness)} />
    </>
  );
}
