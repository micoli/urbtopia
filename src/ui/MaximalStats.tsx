import { useEffect, useRef } from 'react';
import { cityGreenBenefits, ECOLOGY_UNLOCKS, ECOLOGY, energyStats, HOME_TIERS, homePower, productionFactors, productionTierOf, isItemUnlocked, minTierOf, durationOf, producibleItems, totalCitizens, transportStats, utilityCapacity, utilityDemand, type BuildingType } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useGame, useUi } from './hooks';
import { TransitPanel } from './TransitPanel';
import { BusLinesPanel } from './BusLinesPanel';
import type { MessageKey } from '../i18n/messages';

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
      if (event.key === 'Escape') { event.preventDefault(); toggle(); }
      if (event.key !== 'Tab') return;
      const nodes = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]') ?? [])];
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [open, toggle]);
  if (!open) return null;
  const energy = energyStats(state), green = cityGreenBenefits(state), transport = transportStats(state);
  const homes = state.buildings.filter(b => b.type === 'home');
  const saved = homes.reduce((sum, b) => sum + (HOME_TIERS[b.tier - 1]?.power ?? 0) - homePower(b), 0);
  const operatingRatio = (state.adaptationUntil ?? 0) > state.lastSeen ? 1 : energy.economicRatio;
  const activityEmissions = state.buildings.reduce((sum, b) => sum + (b.type === 'factory' ? 2 * b.tier : b.type === 'workshop' ? 0.5 * b.tier : 0), 0) * operatingRatio;
  const countTypes: BuildingType[] = ['home', 'workshop', 'factory', 'shop', 'powerPlant', 'solar', 'battery', 'backup', 'tree', 'park', 'busStop', 'brtStation', 'railStation'];
  const rows: [MessageKey, number | string][] = [
    ['eco.demand', energy.demand], ['transit.power', energy.transitDemand], ['eco.saved', saved], ['eco.solar', energy.solar], ['eco.wind', energy.wind], ['eco.backup', energy.backup],
    ['eco.unmet', energy.unmet], ['eco.surplus', energy.surplus], ['eco.storage', `${energy.stored.toFixed(1)} / ${energy.storageCapacity}`],
    ['eco.cost', energy.costPerHour + transport.costPerHour],
  ];
  const objectives: [MessageKey, boolean][] = [
    ['eco.objectiveInsulate', homes.some(b => b.insulated)], ['eco.objectiveGreen', green.covered > 0],
    ['eco.objectiveShare', energy.transfers.length > 0], ['eco.objectiveBattery', energy.stored > 0], ['eco.objectiveBus', transport.riders > 0],
  ];
  return <div className="dialog-backdrop" onClick={event => { if (event.target === event.currentTarget) toggle(); }}>
    <div className="eco-dashboard" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="eco-heading">
      <header><h2 id="eco-heading">{t('eco.title')} · 👥 {totalCitizens(state)}</h2><button type="button" aria-label={t('panel.close')} onClick={toggle}>✕</button></header>
      <p>{t('eco.units')}</p>
      <section><h3>{t('eco.production')}</h3><div className="eco-counts">{countTypes.map(type => <span key={type}>{t(`building.${type}`)}: {state.buildings.filter(b => b.type === type).length}{totalCitizens(state) < (ECOLOGY_UNLOCKS[type] ?? 0) && <small> · {t('eco.locked')}: {ECOLOGY_UNLOCKS[type]}</small>}</span>)}</div>
        <p>{t('eco.productionHelp')}</p>
        <table><thead><tr><th>{t('eco.production')}</th><th>{t('eco.nominal')}</th><th>{t('eco.effective')}</th></tr></thead><tbody>
          {(['workshop', 'factory'] as const).flatMap(type => producibleItems(type).map(item => {
            if (!isItemUnlocked(state,item)) return null;
              const buildings = state.buildings.filter(b => b.type === type && b.tier >= minTierOf(item));
            const rate = (b: typeof buildings[number]) => ECOLOGY.hourMs / (durationOf(item) * productionTierOf(b).durationFactor) * productionTierOf(b).yield;
            const nominal = buildings.reduce((n, b) => n + rate(b), 0);
            const active = buildings.filter(b => b.queue.find(q => !q.done)?.item === item).reduce((n, b) => n + rate(b), 0);
            if (!nominal) return null;
            return <tr key={item}><td>{t(`item.${item}`)}</td><td>{nominal.toFixed(1)}</td><td>{(active * ((state.adaptationUntil ?? 0) > state.lastSeen ? 1 : energy.economicRatio)).toFixed(1)}</td></tr>;
          }))}</tbody></table>
        <p>{t('eco.slots')}: {state.buildings.reduce((n, b) => n + b.queue.length, 0)} / {state.buildings.reduce((n, b) => n + b.slotCount, 0)}</p>
      </section>
      <section>
        <h3>{t('eco.energy')}</h3>
        <dl>
            {rows.map(([key, value]) => <div key={key}><dt>{t(key)}</dt><dd>{typeof value === 'number' ? value.toFixed(1) : value}</dd></div>)}
        </dl>
        <p>{t('eco.energyHelp')}</p><p>{t('eco.adviceDemand')}</p>
        {(state.adaptationUntil ?? 0) > state.lastSeen && <aside><strong>{t('eco.adaptation')}: {(((state.adaptationUntil ?? 0) - state.lastSeen) / ECOLOGY.hourMs).toFixed(1)}</strong><p>{t('eco.adaptationHelp')}</p></aside>}
        <h4>{t('eco.forecast')}</h4><p>{Array.from({ length: 6 }, (_, i) => { const f = productionFactors(state.lastSeen + (state.timeOffset ?? 0) + (i + 1) * ECOLOGY.hourMs); return `+${i + 1}h: ${(100 * f.solar).toFixed(0)}% / ${(100 * f.wind).toFixed(0)}%`; }).join(' · ')}</p>
        <h4>{t('eco.transfers')}</h4>{energy.transfers.map(x => <p key={`${x.from}-${x.to}`}>#{x.from} → #{x.to}: {x.amount.toFixed(2)}</p>)}
      </section>
      <section>
        <h3>{t('stat.water')}</h3>
        <p>{utilityDemand(state).water} / {utilityCapacity(state).water}</p>
      </section>
      <section><h3>{t('building.park')}</h3><dl>{([['eco.cooling', green.cooling], ['eco.biodiversity', green.biodiversity], ['eco.wellbeing', green.wellbeing], ['eco.greenCoverage', green.covered]] as [MessageKey, number][]).map(([key, value]) => <div key={key}><dt>{t(key)}</dt><dd>{value.toFixed(1)}{key === 'eco.greenCoverage' ? '' : ' / 100'}</dd></div>)}</dl><p>{t('eco.greenHelp')}</p>{green.covered < totalCitizens(state) && <p>{t('eco.adviceGreen')}</p>}</section>
      <section><h3>{t('eco.emissions')}</h3><p>{t('eco.activity')}: {activityEmissions.toFixed(1)} · {t('eco.backup')}: {energy.emissions.toFixed(1)} · {t('eco.mobility')}: {transport.emissions.toFixed(1)}</p></section>
      <section><h3>{t('eco.transport')}</h3><p>{t('eco.coverage')}: {transport.covered} · {t('eco.riders')}: {transport.riders.toFixed(1)} · {t('eco.cost')}: {transport.costPerHour}</p><p>{t('eco.transportHelp')}</p>{transport.lines.some(l => l.active && !l.riders) && <p>{t('eco.adviceBus')}</p>}<BusLinesPanel /><TransitPanel /></section>
      {!state.ecologyDismissed && <section><h3>{t('eco.objectives')}</h3>{objectives.map(([key, done]) => <p key={key}>{done ? '✓' : '○'} {t(key)}</p>)}<button type="button" onClick={() => gameStore.getState().send({ type: 'DismissEcology' })}>{t('eco.dismiss')}</button></section>}
    </div>
  </div>;
}
