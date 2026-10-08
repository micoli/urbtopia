import { isVenue, takingsDue, type Building } from '../../core';
import { t } from '../../i18n/t';
import { UrbsStat } from '../common/UrbsStat';
import { UrbsAmount } from '../common/UrbsAmount';
import { VenueRates } from './VenueRates';

interface VenueStatsProps {
  venue: Building;
}

// What sits at the top of the main menu: the Urbs of the city, the Takings waiting in the Venue and how it performs per hour.
export function VenueStats({ venue }: VenueStatsProps) {
  return (
    <>
      <UrbsStat />
      {isVenue(venue) ? (
        <>
          <div className="dock-stat" title={t('venue.takings')}>
            <span className="dock-stat-value"><UrbsAmount value={takingsDue(venue.venue)} /></span>
            <span className="dock-stat-label" aria-hidden="true">💰</span>
          </div>
          <VenueRates venue={venue} />
        </>
      ) : null}
    </>
  );
}
