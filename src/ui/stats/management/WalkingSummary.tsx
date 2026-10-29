import {useMemo} from 'react';
import {WALK_DESTINATIONS, crossingFlows, footbridgeFlows, type CongestionStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {WalkFlowList} from './WalkFlowList';

interface WalkingSummaryProps {
    state: GameState;
    congestion: CongestionStats;
}

export function WalkingSummary({state, congestion}: WalkingSummaryProps) {
    const crossings = useMemo(() => crossingFlows(congestion), [congestion]);
    const footbridges = useMemo(() => footbridgeFlows(state, congestion), [state, congestion]);
    const trips = WALK_DESTINATIONS.map(kind => `${t(`eco.walk.${kind}`)} ${congestion.walkingTrips[kind].toFixed(0)}`).join(' · ');
    const rides = WALK_DESTINATIONS.map(kind => `${t(`eco.walk.${kind}`)} ${congestion.cyclingTrips[kind].toFixed(0)}`).join(' · ');
    return <>
        <p>{t('eco.commutersOnFoot')}: {congestion.walkers.toFixed(0)} · {t('eco.commutersByBike')}: {congestion.cyclists.toFixed(0)} · {t('eco.saturatedCrossings')}: {congestion.saturatedCrossings}</p>
        <p>{t('eco.walkingTrips')}: {trips}</p>
        <p>{t('eco.cyclingTrips')}: {rides}</p>
        <WalkFlowList title={t('eco.crossingFlows')} flows={crossings}/>
        <WalkFlowList title={t('eco.footbridgeFlows')} flows={footbridges}/>
        <p>{t('eco.walkHelp')}</p>
    </>;
}
