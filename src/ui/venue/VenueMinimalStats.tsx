import { isVenue, takingsDue, type Building } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { UrbsSymbol } from '../common/UrbsSymbol';

interface VenueMinimalStatsProps {
  venue: Building;
}

export function VenueMinimalStats({ venue }: VenueMinimalStatsProps) {
  const urbs = useGame(store => store.state.urbs);
  return (
    <div className="minimal-stats" aria-label={t(`building.${venue.type}`)}>
      <strong>{Math.floor(urbs)}</strong> <UrbsSymbol />
      {isVenue(venue) ? <> · 💰 <UrbsAmount value={takingsDue(venue.venue)} /></> : null}
    </div>
  );
}
