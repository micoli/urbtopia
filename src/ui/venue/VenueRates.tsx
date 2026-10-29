import { venueTypeOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { useVenuePerformance } from './useVenuePerformance';
import { Icon } from '../common/Icon';

interface VenueRatesProps {
  venue: Building;
}

export function VenueRates({ venue }: VenueRatesProps) {
  const performance = useVenuePerformance(venue.id);
  if (!performance) return null;
  return (
    <div className="dock-stat dock-stat--rates">
      <span className="dock-rate" title={t('venue.earnings')}>
        <Icon name="trend" />
        <UrbsAmount value={performance.earningsPerHour} />
      </span>
      <span className="dock-rate" title={t('venue.attractiveness')}>
        <Icon name="sparkles" />
        {Math.round(performance.layout.attractiveness * 100)} %
      </span>
      <span className="dock-rate" title={t(`venue.visitors.${venueTypeOf(venue)}`)}>
        <Icon name="citizens" />
        {performance.visitors.toFixed(1)}
      </span>
    </div>
  );
}
