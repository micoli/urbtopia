import {useEffect, useRef} from 'react';
import {
    cityBenefits,
    economicPower,
    greenProfileOf,
    climateStats,
    ECOLOGY_UNLOCKS,
    ECOLOGY,
    energyStats,
    HOME_TIERS,
    homePower,
    productionFactors,
    productionTierOf,
    isItemUnlocked,
    minTierOf,
    durationOf,
    producibleItems,
    totalCitizens,
    transportStats,
    utilityCapacity,
    utilityDemand,
    type BuildingType
} from '../../core';
import {t} from '../../i18n/t';
import {itemName} from '../../i18n/itemName';
import {gameStore} from '../../store/gameStore';
import {useGame, useUi} from '../common/hooks';
import {TransitPanel} from '../transit/TransitPanel';
import {BusLinesPanel} from '../transit/BusLinesPanel';
import {ServicesSection} from '../buildings/ServicesSection';
import type {MessageKey} from '../../i18n/messages';
import {NextUnlock} from "./NextUnlock.tsx";
import { ActionButton } from '../common/ActionButton';
import { SectionHeading } from '../common/SectionHeading';
import { LabeledList } from '../common/LabeledList';

export function MaximalStats() {
    const state = useGame(s => s.state);
    const open = useUi(s => s.statsOpen);
    const toggle = useUi(s => s.toggleStats);
    const panel = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        panel.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                toggle();
            }
            if (event.key !== 'Tab') return;
            const nodes = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]') ?? [])];
            const first = nodes[0], last = nodes.at(-1);
            if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
                event.preventDefault();
                last?.focus();
            }
            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            previous?.focus();
        };
    }, [open, toggle]);
    if (!open) return null;
    const energy = energyStats(state), green = cityBenefits(state, energy.coalRates), transport = transportStats(state);
    const homes = state.buildings.filter(b => b.type === 'home');
    const saved = homes.reduce((sum, b) => sum + (HOME_TIERS[b.tier - 1]?.power ?? 0) - homePower(b), 0);
    const climate = climateStats(state);
    const countTypes: BuildingType[] = ['home', 'workshop', 'factory', 'shop', 'casino', 'powerPlant', 'coalPlant', 'solar', 'battery', 'backup', 'tree', 'park', 'busStop', 'brtStation', 'railStation'];
    const casinos = state.buildings.filter(b => b.type === 'casino');
    const leisureGain = casinos.length ? green.wellbeing - cityBenefits({...state, buildings: state.buildings.filter(b => b.type !== 'casino')}).wellbeing : 0;
    const casinoRows: [MessageKey, number | string][] = casinos.length ? [['casino.demand', casinos.reduce((sum, b) => sum + economicPower(b), 0)], ['casino.wellbeingGain', `+${leisureGain.toFixed(1)}`]] : [];
    const rows: [MessageKey, number | string][] = [
        ['eco.demand', energy.demand], ['transit.power', energy.transitDemand], ['eco.saved', saved], ['eco.solar', energy.solar], ['eco.wind', energy.wind], ['eco.coalCapacity', energy.coalCapacity], ['eco.coal', energy.coal], ['eco.coalCost', energy.coalCostPerHour], ['eco.backup', energy.backup],
        ['eco.unmet', energy.unmet], ['eco.surplus', energy.surplus], ['eco.storage', `${energy.stored.toFixed(1)} / ${energy.storageCapacity}`],
        ['eco.cost', energy.costPerHour + transport.costPerHour],
        ...casinoRows,
    ];
    const objectives: [MessageKey, boolean][] = [
        ['eco.objectiveInsulate', homes.some(b => b.insulated)], ['eco.objectiveGreen', green.covered > 0],
        ['eco.objectiveShare', energy.transfers.length > 0], ['eco.objectiveBattery', energy.stored > 0], ['eco.objectiveBus', transport.riders > 0],
    ];
    const citizens = totalCitizens(state);
    const navigation: [string, string, MessageKey][] = [
        ['production', '▦', 'eco.production'], ['energy', '⚡', 'eco.energy'],
        ['nature', '♧', 'build.greenSpaces'], ['services', '✚', 'stats.services'], ['transport', '↔', 'eco.transport'],
    ];
    return <div className="dialog-backdrop city-management-backdrop" onClick={event => {
        if (event.target === event.currentTarget) toggle();
    }}>
        <div className="eco-dashboard" ref={panel} tabIndex={-1} role="dialog" aria-modal="true"
             aria-labelledby="eco-heading">
            <header className="eco-header"><img src={`${import.meta.env.BASE_URL}assets/icons/town-management.png`}
                                                alt=""/><h2 id="eco-heading">{t('eco.title')}</h2>
                <button type="button" aria-label={t('panel.close')} onClick={toggle}>✕</button>
            </header>
            <div className="eco-overview">
                <div><span aria-hidden="true">👥</span>
                    <div><span>{t('stat.citizens')}</span><strong>{citizens}</strong></div>
                </div>
                <div data-warning={energy.unmet > 0}><span aria-hidden="true">⚡</span>
                    <div><span>{t('eco.energy')}</span><strong>{Math.max(0, energy.demand - energy.unmet).toFixed(1)}
                        <small>/ {energy.demand.toFixed(1)}</small></strong></div>
                </div>
                <div><span aria-hidden="true">♧</span>
                    <div><span>{t('eco.wellbeing')}</span><strong>{green.wellbeing.toFixed(0)} <small>/
                        100</small></strong></div>
                </div>
                <div title={t('eco.temperatureHelp')}><span aria-hidden="true">🌡️</span>
                    <div><span>{t('eco.temperature')}</span><strong>{climate.temperature.toFixed(1)}{' '}
                        <small>°C</small></strong><small>{t('eco.temperatureOptimum')}</small></div>
                </div>
                <button type="button" aria-controls="eco-transport"
                        onClick={() => panel.current?.querySelector('#eco-transport')?.scrollIntoView({
                            block: 'start',
                            behavior: 'smooth'
                        })}><span aria-hidden="true">↔</span><span
                    className="eco-overview-value"><span>{t('eco.riders')}</span><strong>{transport.riders.toFixed(1)}</strong></span>
                </button>
            </div>
            <nav className="eco-navigation" aria-label={t('eco.title')}>{navigation.map(([id, icon, label]) => <button
                type="button" key={id} onClick={() => panel.current?.querySelector(`#eco-${id}`)?.scrollIntoView({
                block: 'start',
                behavior: 'smooth'
            })}><span aria-hidden="true">{icon}</span>{t(label)}</button>)}</nav>
            <p className="eco-units">{t('eco.units')}</p>
            <div className="eco-sections">
                <section id="eco-production" className="eco-wide"><SectionHeading icon="▦">{t('eco.production')}</SectionHeading>
                    <div className="eco-counts">{countTypes.map(type => <span key={type}
                                                                              data-locked={citizens < (ECOLOGY_UNLOCKS[type] ?? 0)}><span>{t(`building.${type}`)}</span><strong>{state.buildings.filter(b => b.type === type).length}</strong>{citizens < (ECOLOGY_UNLOCKS[type] ?? 0) &&
                        <small>◇ {t('eco.locked')}: {ECOLOGY_UNLOCKS[type]}</small>}</span>)}
                        <span><span>{t('eco.solarHome')}</span><strong>{homes.filter(b => b.solar).length}</strong></span></div>
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
                            const active = buildings.filter(b => b.queue.find(q => !q.done)?.item === item).reduce((n, b) => n + rate(b), 0);
                            if (!nominal) return null;
                            return <tr key={item}>
                                <td>{itemName(item)}</td>
                                <td>{nominal.toFixed(1)}</td>
                                <td>{(active * ((state.adaptationUntil ?? 0) > state.lastSeen ? 1 : energy.economicRatio)).toFixed(1)}</td>
                            </tr>;
                        }))}</tbody>
                    </table>
                    <p>{t('eco.slots')}: {state.buildings.reduce((n, b) => n + b.queue.length, 0)} / {state.buildings.reduce((n, b) => n + b.slotCount, 0)}</p>
                </section>
                <section id="eco-energy" className="eco-wide">
                    <SectionHeading icon="⚡">{t('eco.energy')}</SectionHeading>
                    <LabeledList>
                        {rows.map(([key, value]) => <LabeledList.Row key={key} label={t(key)}>
                            {typeof value === 'number' ? value.toFixed(1) : value}
                        </LabeledList.Row>)}
                    </LabeledList>
                    <p>{t('eco.energyHelp')}</p><p>{t('eco.adviceDemand')}</p>
                    <p>{t('eco.coalDispatch')}</p>
                    {(state.adaptationUntil ?? 0) > state.lastSeen && <aside>
                        <strong>{t('eco.adaptation')}: {(((state.adaptationUntil ?? 0) - state.lastSeen) / ECOLOGY.hourMs).toFixed(1)}</strong>
                        <p>{t('eco.adaptationHelp')}</p></aside>}
                    <h4>{t('eco.forecast')}</h4><p>{Array.from({length: 6}, (_, i) => {
                    const f = productionFactors(state.lastSeen + (state.timeOffset ?? 0) + (i + 1) * ECOLOGY.hourMs);
                    return `+${i + 1}h: ${(100 * f.solar).toFixed(0)}% / ${(100 * f.wind).toFixed(0)}%`;
                }).join(' · ')}</p>
                    <h4>{t('eco.transfers')}</h4>{energy.transfers.map(x => <p key={`${x.from}-${x.to}`}>#{x.from} →
                    #{x.to}: {x.amount.toFixed(2)}</p>)}
                </section>
                <section>
                    <SectionHeading>{t('stat.water')}</SectionHeading>
                    <p>{utilityDemand(state).water} / {utilityCapacity(state).water}</p>
                </section>
                <ServicesSection state={state}/>
                <section id="eco-nature">
                    <p>{t('build.greenSpaces')}: {state.buildings.filter(b => greenProfileOf(b.type)).length}</p><SectionHeading icon="♧">{t('build.greenSpaces')}</SectionHeading>
                    <LabeledList>{([['eco.cooling', green.cooling], ['eco.biodiversity', green.biodiversity], ['eco.wellbeing', green.wellbeing], ['eco.greenCoverage', green.covered]] as [MessageKey, number][]).map(([key, value]) =>
                        <LabeledList.Row key={key} label={t(key)}>
                            {value.toFixed(1)}{key === 'eco.greenCoverage' ? '' : ' / 100'}
                        </LabeledList.Row>)}</LabeledList>
                    <p>{t('eco.greenHelp')}</p>{green.covered < totalCitizens(state) && <p>{t('eco.adviceGreen')}</p>}
                </section>
                <section><SectionHeading>{t('eco.wellbeing')}</SectionHeading><p>{t('eco.coalPenalty')}:
                    −{green.pollutionPenalty.toFixed(1)}</p><p>{t('eco.coalPollutionHelp')}</p></section>
                <section><SectionHeading>{t('eco.emissions')}</SectionHeading>
                    <p>{t('eco.activity')}: {climate.activityEmissions.toFixed(1)} · {t('eco.coal')}: {energy.coalEmissions.toFixed(1)} · {t('eco.backup')}: {energy.backupEmissions.toFixed(1)} · {t('eco.mobility')}: {transport.emissions.toFixed(1)}</p>
                    <p>{t('eco.temperatureHelp')}</p></section>
                <section id="eco-transport" className="eco-wide"><SectionHeading icon="↔">{t('eco.transport')}</SectionHeading>
                    <p>{t('eco.coverage')}: {transport.covered} · {t('eco.riders')}: {transport.riders.toFixed(1)} · {t('eco.cost')}: {transport.costPerHour}</p>
                    <p>{t('eco.transportHelp')}</p>{transport.lines.some(l => l.active && !l.riders) &&
                        <p>{t('eco.adviceBus')}</p>}<BusLinesPanel/><TransitPanel/></section>
                {!state.ecologyDismissed && <section className="eco-wide eco-objectives">
                    <SectionHeading>{t('eco.objectives')}</SectionHeading>{objectives.map(([key, done]) => <p key={key}
                                                                                      data-complete={done}>{done ? '✓' : '○'} {t(key)}</p>)}
                    <ActionButton variant="primary" className="eco-primary"
                            onClick={() => gameStore.getState().send({type: 'DismissEcology'})}>{t('eco.dismiss')}</ActionButton>
                </section>}
                <section id="next-unlock" className="eco-wide">
                    <SectionHeading>{t('eco.nextUnlock')}</SectionHeading>
                    <NextUnlock/>
                </section>
            </div>
        </div>
    </div>;
}
