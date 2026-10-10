import { venueTypeOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { useVenuePerformance } from './useVenuePerformance';

interface VenueRatesProps {
  venue: Building;
}

export function VenueRates({ venue }: VenueRatesProps) {
  const performance = useVenuePerformance(venue.id);
  if (!performance) return null;
  return (
    <div className="dock-stat dock-stat--rates">
      <span className="dock-rate" title={t('venue.earnings')}>
        <span aria-hidden="true">📈</span>
        <UrbsAmount value={performance.earningsPerHour} />
      </span>
      <span className="dock-rate" title={t('venue.attractiveness')}>
        <span aria-hidden="true">✨</span>
        {Math.round(performance.layout.attractiveness * 100)} %
      </span>
      <span className="dock-rate" title={t(`venue.visitors.${venueTypeOf(venue)}`)}>
        <span aria-hidden="true">👥</span>
        {performance.visitors.toFixed(1)}
      </span>
    </div>
  );
}
