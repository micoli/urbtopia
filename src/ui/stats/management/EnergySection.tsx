import {
    ECOLOGY, HOME_TIERS, cityBenefits, economicPower, energySavingOf, energyStats, homePower, productionFactors, transportStats, type GameState, isHomeType } from '../../../core';
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

type EnergyRow = [MessageKey, number | string, boolean?];
interface EnergyGroup {
    title: MessageKey;
    kind?: 'production' | 'consumption';
    rows: EnergyRow[];
}

function casinoRows(state: GameState, green: ReturnType<typeof cityBenefits>): EnergyRow[] {
    const casinos = state.buildings.filter(b => b.type === 'casino');
    if (!casinos.length) return [];
    const withoutCasinos = cityBenefits({...state, buildings: state.buildings.filter(b => b.type !== 'casino')});
    return [
        ['casino.demand', casinos.reduce((sum, b) => sum + economicPower(b, energySavingOf(state)), 0)],
        ['casino.wellbeingGain', `+${(green.wellbeing - withoutCasinos.wellbeing).toFixed(1)}`],
    ];
}

export function EnergySection({state, energy, green, transport}: EnergySectionProps) {
    const saved = state.buildings.filter(b => isHomeType(b.type)).reduce((sum, b) => sum + (HOME_TIERS[b.tier - 1]?.power ?? 0) - homePower(b, energySavingOf(state)), 0);
    const renewables = energy.solar + energy.wind + energy.hydro + energy.geothermal;
    const groups: EnergyGroup[] = [
        {title: 'eco.group.demand', kind: 'consumption', rows: [['eco.demand', energy.demand, true], ['transit.power', energy.transitDemand], ['eco.saved', saved]]},
        {title: 'eco.group.renewable', kind: 'production', rows: [['eco.solar', energy.solar], ['eco.wind', energy.wind], ['eco.hydro', energy.hydro], ['eco.geothermal', energy.geothermal], ['eco.subtotal.renewable', renewables, true]]},
        {title: 'eco.group.coal', kind: 'production', rows: [['eco.coalCapacity', energy.coalCapacity], ['eco.coal', energy.coal, true], ['eco.coalCost', energy.coalCostPerHour]]},
        {title: 'eco.group.backup', kind: 'production', rows: [['eco.backup', energy.backup, true]]},
        {title: 'eco.group.supply', rows: [['eco.subtotal.supply', renewables + energy.coal + energy.backup, true], ['eco.unmet', energy.unmet], ['eco.surplus', energy.surplus]]},
        {title: 'eco.group.storage', rows: [['eco.storage', `${energy.stored.toFixed(1)} / ${energy.storageCapacity}`]]},
        {title: 'eco.group.cost', kind: 'consumption', rows: [['eco.cost', energy.costPerHour + transport.costPerHour, true]]},
        ...(casinoRows(state, green).length ? [{title: 'eco.group.casino' as const, rows: casinoRows(state, green)}] : []),
    ];
    const forecast = Array.from({length: FORECAST_HOURS}, (_, i) => {
        const factors = productionFactors(state.lastSeen + (state.timeOffset ?? 0) + (i + 1) * ECOLOGY.hourMs);
        return `+${i + 1}h: ${(100 * factors.solar).toFixed(0)}% / ${(100 * factors.wind).toFixed(0)}% / ${(100 * factors.hydro).toFixed(0)}%`;
    });
    return <section id="eco-energy" className="eco-wide">
        <SectionHeading icon="power">{t('eco.energy')}</SectionHeading>
        {groups.map(group => <div key={group.title} className="eco-energy-group" data-kind={group.kind}>
            <h4>{t(group.title)}</h4>
            <LabeledList>
                {group.rows.map(([key, value, subtotal]) => <LabeledList.Row key={key} label={t(key)} className={subtotal ? 'eco-subtotal' : undefined}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                </LabeledList.Row>)}
            </LabeledList>
        </div>)}
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
