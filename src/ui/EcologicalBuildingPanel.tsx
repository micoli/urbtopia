import { ECOLOGY, greenProfileOf, energyStats, greenSpaceCoverage, homePower, transportStats, type Building } from '../core';
import { t } from '../i18n/t';
import { useGame, useUi } from './hooks';
import { productionFactors } from '../core/energy';

export function EcologicalBuildingPanel({ building }: { building: Building; }) {
  const state = useGame(s => s.state);
  const toggleStats = useUi(s => s.toggleStats);
  const energy = energyStats(state);
  const transport = transportStats(state);
  const greenProfile = greenProfileOf(building.type);
  const coveredCitizens = greenProfile ? greenSpaceCoverage(state, building) : 0;
  return <section className="production">
    {building.type === 'battery' && <><p><strong>{t('eco.storage')}</strong>: {(building.storedEnergy ?? 0).toFixed(1)} / {ECOLOGY.batteryCapacity}</p><p>⚡ {(energy.batteryRates.get(building.id) ?? 0).toFixed(1)} / h</p></>}
    {building.type === 'solar' && <p><strong>{t('eco.solar')}</strong>: {(16 * productionFactors(state.lastSeen + (state.timeOffset ?? 0)).solar).toFixed(1)} / h</p>}
    {building.type === 'backup' && <><p><strong>{t('eco.backup')}</strong>: {ECOLOGY.backupCapacity} / h</p><p>{t('eco.cost')}: {ECOLOGY.backupCost} / ⚡ · {t('eco.emissions')}: 2 / ⚡</p></>}
    {greenProfile && <><p>{t('eco.greenCoverage')}: {coveredCitizens}</p><p>{t('eco.greenHelp')}</p></>}
    {['busStop', 'brtStation', 'railStation'].includes(building.type) && <><p>{t('eco.stop')} #{building.id} · ({building.x}, {building.y})</p><p>{t('transit.lines')}: {transport.lines.filter(l => l.stops.includes(building.id)).map(l => `#${l.id}`).join(', ') || '—'}</p><p>{t('eco.lineHelp')}</p>{transport.lines.filter(l => l.stops.includes(building.id)).map(l => <p key={l.id}>#{l.id} · {t(l.active ? 'eco.active' : 'eco.inactive')} · {t('transit.headway')}: {Number.isFinite(l.headway) ? `${l.headway.toFixed(1)} min` : '—'}</p>)}</>}
    {building.type === 'home' && building.solar && <><p>{t('eco.solar')}: {(2 * building.tier * productionFactors(state.lastSeen + (state.timeOffset ?? 0)).solar).toFixed(1)} / h · {t('eco.demand')}: {homePower(building).toFixed(1)}</p>{energy.transfers.filter(x => x.from === building.id || x.to === building.id).map(x => <p key={`${x.from}-${x.to}`}>#{x.from} → #{x.to}: {x.amount.toFixed(2)}</p>)}</>}
    <button type="button" className="panel-button" onClick={toggleStats}>{t('eco.title')}</button>
  </section>;
}
