import {
    ECOLOGY,
    greenProfileOf,
    energyStats,
    greenSpaceCoverage,
    homePower,
    transportStats,
    type Building
} from '../../core';
import {lineStatusKey} from '../stats/management/transit/lineStatusKey';
import {t} from '../../i18n/t';
import {useGame, useUi} from '../common/hooks';
import {productionFactors} from '../../core/environment/energy';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';

export function EcologicalBuildingPanel({building}: { building: Building; }) {
    const state = useGame(s => s.state);
    const toggleStats = useUi(s => s.toggleStats);
    const energy = energyStats(state);
    const transport = transportStats(state);
    const greenProfile = greenProfileOf(building.type);
    const coveredCitizens = greenProfile ? greenSpaceCoverage(state, building) : 0;
    return <DrawerPanel>
        {building.type === 'battery' && <>
            <DrawerPanel.LabelValue
                label={t('eco.storage')}
                value={<>{(building.storedEnergy ?? 0).toFixed(1)} / ${ECOLOGY.batteryCapacity}</>}
            >
                ⚡ {(energy.batteryRates.get(building.id) ?? 0).toFixed(1)} / h
            </DrawerPanel.LabelValue>
        </>}

        {building.type === 'solar' && <DrawerPanel.LabelValue
            label={t('eco.solar')}
            value={<>{(16 * productionFactors(state.lastSeen + (state.timeOffset ?? 0)).solar).toFixed(1)} / h</>}/>}

        {building.type === 'backup' && <DrawerPanel.LabelValue
            label={t('eco.backup')}
            value={<>{ECOLOGY.backupCapacity} / h</>}
        >
            {t('eco.cost')}: {ECOLOGY.backupCost} / ⚡ · {t('eco.emissions')}: 2 / ⚡
        </DrawerPanel.LabelValue>}

        {greenProfile && <DrawerPanel.LabelValue
            label={t('eco.greenCoverage')}
            value={coveredCitizens}
        >
            {t('eco.greenHelp')}
        </DrawerPanel.LabelValue>}

        {['busStop', 'brtStation', 'railStation'].includes(building.type) && <DrawerPanel.LabelValue
            label={`${t('eco.stop')} #${building.id} · (${building.x}, ${building.y})`}
            value={t('transit.lines')}
        >
            {transport.lines
                .filter(l => l.stops
                    .includes(building.id))
                .map(l => `#${l.id}`).join(', ') || '—'}
            <p>{t('eco.lineHelp')}</p>
            {transport.lines.filter(l => l.stops
                .includes(building.id))
                .map(l => <p
                    key={l.id}
                >
                    #{l.id} · {t(lineStatusKey(l.status))} · {t('transit.headway')}: {Number.isFinite(l.headway) ? `${l.headway.toFixed(1)} min` : '—'}
                </p>)
            }
        </DrawerPanel.LabelValue>}

        {building.type === 'home' && building.solar && <DrawerPanel.LabelValue
            label={t('eco.solar')}
            value={<>{(2 * building.tier * productionFactors(state.lastSeen + (state.timeOffset ?? 0)).solar).toFixed(1)} /
                h</>}
        >
            <p>{t('eco.demand')}: {homePower(building).toFixed(1)}</p>
            {energy.transfers
                .filter(x => x.from === building.id || x.to === building.id)
                .map(x => <p key={`${x.from}-${x.to}`}>#{x.from} → #{x.to}: {x.amount.toFixed(2)}</p>)
            }
        </DrawerPanel.LabelValue>
        }
        <ActionButton block onClick={toggleStats}>{t('eco.title')}</ActionButton>
    </DrawerPanel>;
}
