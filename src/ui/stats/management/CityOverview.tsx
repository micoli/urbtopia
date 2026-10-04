import {climateStats, cityBenefits, energyStats, totalCitizens, transportStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {OverviewTile} from './OverviewTile';

interface CityOverviewProps {
    state: GameState;
    energy: ReturnType<typeof energyStats>;
    green: ReturnType<typeof cityBenefits>;
    climate: ReturnType<typeof climateStats>;
    transport: ReturnType<typeof transportStats>;
    onShowTransport: () => void;
}

export function CityOverview({state, energy, green, climate, transport, onShowTransport}: CityOverviewProps) {
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
        <button type="button" aria-controls="eco-transport" onClick={onShowTransport}>
            <span aria-hidden="true">↔</span>
            <span className="eco-overview-value"><span>{t('eco.riders')}</span><strong>{transport.riders.toFixed(1)}</strong></span>
        </button>
    </div>;
}
