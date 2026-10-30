import {climateStats, cityAttractiveness, cityBenefits, energyStats, isAttraction, modeShares, touristsPerDay, totalCitizens, transportStats, wasteSituation, type CongestionStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {OverviewTile} from './OverviewTile';
import { Icon } from '../../common/Icon';

interface CityOverviewProps {
    state: GameState;
    energy: ReturnType<typeof energyStats>;
    green: ReturnType<typeof cityBenefits>;
    climate: ReturnType<typeof climateStats>;
    transport: ReturnType<typeof transportStats>;
    congestion: CongestionStats;
    onShowTransport: () => void;
    onShowTraffic: () => void;
    onShowNeeds: () => void;
    onShowTemperature: () => void;
    onShowWaste: () => void;
    onShowTourism: () => void;
}

export function CityOverview({state, energy, green, climate, transport, congestion, onShowTransport, onShowTraffic, onShowNeeds, onShowTemperature, onShowWaste, onShowTourism}: CityOverviewProps) {
    const waste = wasteSituation(state);
    const attractiveness = cityAttractiveness(state);
    const tourists = state.buildings.filter(isAttraction).reduce((total, building) => total + touristsPerDay(building, attractiveness), 0);
    return <div className="eco-overview">
        <OverviewTile icon="citizens">
            <span>{t('stat.citizens')}</span><strong>{totalCitizens(state)}</strong>
        </OverviewTile>
        <OverviewTile icon="power" warning={energy.unmet > 0}>
            <span>{t('eco.energy')}</span>
            <strong>{Math.max(0, energy.demand - energy.unmet).toFixed(1)}<small>/ {energy.demand.toFixed(1)}</small></strong>
        </OverviewTile>
        <button type="button" aria-controls="eco-needs" onClick={onShowNeeds}>
            <Icon name="nature" />
            <span className="eco-overview-value"><span>{t('eco.wellbeing')}</span><strong>{green.wellbeing.toFixed(0)} <small>/ 100</small></strong></span>
        </button>
        <button type="button" aria-controls="eco-waste" data-warning={waste.required && waste.unprocessed > 0} title={t('waste.overview.title')} onClick={onShowWaste}>
            <Icon name="trash" />
            <span className="eco-overview-value"><span>{t('waste.section.title')}</span><strong>{waste.processed.toFixed(0)}<small>/ {waste.produced.toFixed(0)}</small></strong></span>
        </button>
        <button type="button" aria-controls="eco-temperature" title={t('eco.temperatureHelp')} onClick={onShowTemperature}>
            <Icon name="temperature" />
            <span className="eco-overview-value">
                <span>{t('eco.temperature')}</span>
                <strong>{climate.temperature.toFixed(1)}{' '}<small>°C</small></strong>
                <small>{t('eco.temperatureOptimum')}</small>
            </span>
        </button>
        <button type="button" aria-controls="eco-traffic" data-warning={congestion.index > 1} title={t('eco.congestionHelp')} onClick={onShowTraffic}>
            <Icon name="car" />
            <span className="eco-overview-value"><span>{t('eco.congestion')}</span><strong>{(congestion.index * 100).toFixed(0)}<small>%</small></strong></span>
        </button>
        <button type="button" aria-controls="eco-traffic" onClick={onShowTraffic}>
            <Icon name="walk" />
            <span className="eco-overview-value"><span>{t('eco.walkShare')}</span><strong>{(modeShares(congestion).walking * 100).toFixed(0)}<small>%</small></strong></span>
        </button>
        <button type="button" aria-controls="eco-tourism" onClick={onShowTourism}>
            <Icon name="ticket" />
            <span className="eco-overview-value"><span>{t('attraction.tourists')}</span><strong>{Math.round(tourists)}</strong></span>
        </button>
        <button type="button" aria-controls="eco-transport" onClick={onShowTransport}>
            <Icon name="transport" />
            <span className="eco-overview-value"><span>{t('eco.riders')}</span><strong>{transport.riders.toFixed(1)}</strong></span>
        </button>
    </div>;
}
