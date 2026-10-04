import {
    ECOLOGY, HOME_TIERS, cityBenefits, economicPower, energyStats, homePower, productionFactors, transportStats, type GameState
} from '../../../core';
import {t} from '../../../i18n/t';
import type {MessageKey} from '../../../i18n/messages';
import {SectionHeading} from '../../common/SectionHeading';
import {LabeledList} from '../../common/LabeledList';

const FORECAST_HOURS = 6;

interface EnergySectionProps {
    state: GameState;
    energy: ReturnType<typeof energyStats>;
    green: ReturnType<typeof cityBenefits>;
    transport: ReturnType<typeof transportStats>;
}

function casinoRows(state: GameState, green: ReturnType<typeof cityBenefits>): [MessageKey, number | string][] {
    const casinos = state.buildings.filter(b => b.type === 'casino');
    if (!casinos.length) return [];
    const withoutCasinos = cityBenefits({...state, buildings: state.buildings.filter(b => b.type !== 'casino')});
    return [
        ['casino.demand', casinos.reduce((sum, b) => sum + economicPower(b), 0)],
        ['casino.wellbeingGain', `+${(green.wellbeing - withoutCasinos.wellbeing).toFixed(1)}`],
    ];
}

export function EnergySection({state, energy, green, transport}: EnergySectionProps) {
    const saved = state.buildings.filter(b => b.type === 'home').reduce((sum, b) => sum + (HOME_TIERS[b.tier - 1]?.power ?? 0) - homePower(b), 0);
    const rows: [MessageKey, number | string][] = [
        ['eco.demand', energy.demand], ['transit.power', energy.transitDemand], ['eco.saved', saved], ['eco.solar', energy.solar], ['eco.wind', energy.wind],
        ['eco.coalCapacity', energy.coalCapacity], ['eco.coal', energy.coal], ['eco.coalCost', energy.coalCostPerHour], ['eco.backup', energy.backup],
        ['eco.unmet', energy.unmet], ['eco.surplus', energy.surplus], ['eco.storage', `${energy.stored.toFixed(1)} / ${energy.storageCapacity}`],
        ['eco.cost', energy.costPerHour + transport.costPerHour],
        ...casinoRows(state, green),
    ];
    const forecast = Array.from({length: FORECAST_HOURS}, (_, i) => {
        const factors = productionFactors(state.lastSeen + (state.timeOffset ?? 0) + (i + 1) * ECOLOGY.hourMs);
        return `+${i + 1}h: ${(100 * factors.solar).toFixed(0)}% / ${(100 * factors.wind).toFixed(0)}%`;
    });
    return <section id="eco-energy" className="eco-wide">
        <SectionHeading icon="⚡">{t('eco.energy')}</SectionHeading>
        <LabeledList>
            {rows.map(([key, value]) => <LabeledList.Row key={key} label={t(key)}>
                {typeof value === 'number' ? value.toFixed(1) : value}
            </LabeledList.Row>)}
        </LabeledList>
        <p>{t('eco.energyHelp')}</p>
        <p>{t('eco.adviceDemand')}</p>
        <p>{t('eco.coalDispatch')}</p>
        {(state.adaptationUntil ?? 0) > state.lastSeen && <aside>
            <strong>{t('eco.adaptation')}: {(((state.adaptationUntil ?? 0) - state.lastSeen) / ECOLOGY.hourMs).toFixed(1)}</strong>
            <p>{t('eco.adaptationHelp')}</p>
        </aside>}
        <h4>{t('eco.forecast')}</h4>
        <p>{forecast.join(' · ')}</p>
        <h4>{t('eco.transfers')}</h4>
        {energy.transfers.map(x => <p key={`${x.from}-${x.to}`}>#{x.from} → #{x.to}: {x.amount.toFixed(2)}</p>)}
    </section>;
}
