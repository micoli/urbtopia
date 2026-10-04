import {
    ECOLOGY, ECOLOGY_UNLOCKS, durationOf, energyStats, isItemUnlocked, minTierOf, producibleItems, productionTierOf,
    totalCitizens, type BuildingType, type GameState
} from '../../../core';
import {t} from '../../../i18n/t';
import {itemName} from '../../../i18n/itemName';
import {SectionHeading} from '../../common/SectionHeading';

const COUNT_TYPES: BuildingType[] = ['home', 'workshop', 'factory', 'shop', 'casino', 'powerPlant', 'coalPlant', 'solar', 'battery', 'backup', 'tree', 'park', 'busStop', 'brtStation', 'railStation'];

interface ProductionSectionProps {
    state: GameState;
    energy: ReturnType<typeof energyStats>;
}

export function ProductionSection({state, energy}: ProductionSectionProps) {
    const citizens = totalCitizens(state);
    const adapting = (state.adaptationUntil ?? 0) > state.lastSeen;
    return <section id="eco-production" className="eco-wide">
        <SectionHeading icon="▦">{t('eco.production')}</SectionHeading>
        <div className="eco-counts">
            {COUNT_TYPES.map(type => {
                const locked = citizens < (ECOLOGY_UNLOCKS[type] ?? 0);
                return <span key={type} data-locked={locked}>
                    <span>{t(`building.${type}`)}</span>
                    <strong>{state.buildings.filter(b => b.type === type).length}</strong>
                    {locked && <small>◇ {t('eco.locked')}: {ECOLOGY_UNLOCKS[type]}</small>}
                </span>;
            })}
            <span><span>{t('eco.solarHome')}</span><strong>{state.buildings.filter(b => b.type === 'home' && b.solar).length}</strong></span>
        </div>
        <p>{t('eco.productionHelp')}</p>
        <table>
            <thead>
            <tr>
                <th>{t('eco.production')}</th>
                <th>{t('eco.nominal')}</th>
                <th>{t('eco.effective')}</th>
            </tr>
            </thead>
            <tbody>
            {(['workshop', 'factory'] as const).flatMap(type => producibleItems(type).map(item => {
                if (!isItemUnlocked(state, item)) return null;
                const buildings = state.buildings.filter(b => b.type === type && b.tier >= minTierOf(item));
                const rate = (b: typeof buildings[number]) => ECOLOGY.hourMs / (durationOf(item) * productionTierOf(b).durationFactor) * productionTierOf(b).yield;
                const nominal = buildings.reduce((n, b) => n + rate(b), 0);
                if (!nominal) return null;
                const active = buildings.filter(b => b.queue.find(q => !q.done)?.item === item).reduce((n, b) => n + rate(b), 0);
                return <tr key={item}>
                    <td>{itemName(item)}</td>
                    <td>{nominal.toFixed(1)}</td>
                    <td>{(active * (adapting ? 1 : energy.economicRatio)).toFixed(1)}</td>
                </tr>;
            }))}
            </tbody>
        </table>
        <p>{t('eco.slots')}: {state.buildings.reduce((n, b) => n + b.queue.length, 0)} / {state.buildings.reduce((n, b) => n + b.slotCount, 0)}</p>
    </section>;
}
