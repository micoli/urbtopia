import {WALK_DESTINATIONS, type CongestionStats} from '../../../core';
import {t} from '../../../i18n/t';

interface WalkingSummaryProps {
    congestion: CongestionStats;
}

export function WalkingSummary({congestion}: WalkingSummaryProps) {
    const trips = WALK_DESTINATIONS.map(kind => `${t(`eco.walk.${kind}`)} ${congestion.walkingTrips[kind].toFixed(0)}`).join(' · ');
    const rides = WALK_DESTINATIONS.map(kind => `${t(`eco.walk.${kind}`)} ${congestion.cyclingTrips[kind].toFixed(0)}`).join(' · ');
    return <>
        <p>{t('eco.commutersOnFoot')}: {congestion.walkers.toFixed(0)} · {t('eco.commutersByBike')}: {congestion.cyclists.toFixed(0)} · {t('eco.saturatedCrossings')}: {congestion.saturatedCrossings}</p>
        <p>{t('eco.walkingTrips')}: {trips}</p>
        <p>{t('eco.cyclingTrips')}: {rides}</p>
        <p>{t('eco.walkHelp')}</p>
    </>;
}
