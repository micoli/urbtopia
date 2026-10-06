import {climateStats, cityBenefits, energyStats, modeShares, totalCitizens, transportStats, type CongestionStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {OverviewTile} from './OverviewTile';

interface CityOverviewProps {
    state: GameState;
    energy: ReturnType<typeof energyStats>;
    green: ReturnType<typeof cityBenefits>;
    climate: ReturnType<typeof climateStats>;
    transport: ReturnType<typeof transportStats>;
    congestion: CongestionStats;
    onShowTransport: () => void;
    onShowTraffic: () => void;
}

export function CityOverview({state, energy, green, climate, transport, congestion, onShowTransport, onShowTraffic}: CityOverviewProps) {
    return <div className="eco-overview">
        <OverviewTile icon="👥">
            <span>{t('stat.citizens')}</span><strong>{totalCitizens(state)}</strong>
        </OverviewTile>
        <OverviewTile icon="⚡" warning={energy.unmet > 0}>
            <span>{t('eco.energy')}</span>
            <strong>{Math.max(0, energy.demand - energy.unmet).toFixed(1)}<small>/ {energy.demand.toFixed(1)}</small></strong>
        </OverviewTile>
        <OverviewTile icon="♧">
            <span>{t('eco.wellbeing')}</span>
            <strong>{green.wellbeing.toFixed(0)} <small>/ 100</small></strong>
        </OverviewTile>
        <OverviewTile icon="🌡️" title={t('eco.temperatureHelp')}>
            <span>{t('eco.temperature')}</span>
            <strong>{climate.temperature.toFixed(1)}{' '}<small>°C</small></strong>
            <small>{t('eco.temperatureOptimum')}</small>
        </OverviewTile>
        <button type="button" aria-controls="eco-traffic" data-warning={congestion.index > 1} title={t('eco.congestionHelp')} onClick={onShowTraffic}>
            <span aria-hidden="true">🚗</span>
            <span className="eco-overview-value"><span>{t('eco.congestion')}</span><strong>{(congestion.index * 100).toFixed(0)}<small>%</small></strong></span>
        </button>
        <button type="button" aria-controls="eco-traffic" onClick={onShowTraffic}>
            <span aria-hidden="true">🚶</span>
            <span className="eco-overview-value"><span>{t('eco.walkShare')}</span><strong>{(modeShares(congestion).walking * 100).toFixed(0)}<small>%</small></strong></span>
        </button>
        <button type="button" aria-controls="eco-transport" onClick={onShowTransport}>
            <span aria-hidden="true">↔</span>
            <span className="eco-overview-value"><span>{t('eco.riders')}</span><strong>{transport.riders.toFixed(1)}</strong></span>
        </button>
    </div>;
}
