import {
    ECOLOGY,
    greenProfileOf,
    energyStats,
    greenSpaceCoverage,
    homePower,
    transportStats,
    type Building
} from '../../core';
import {lineStatusKey} from '../transit/lineStatusKey';
import {t} from '../../i18n/t';
import {useGame, useUi} from '../common/hooks';
import {productionFactors} from '../../core/environment/energy';
import {DrawerPanelLabelValue} from '../common/DrawerPanelLabelValue.tsx';
import {DrawerProductionPanel} from "../common/DrawerProductionPanel.tsx";
import { ActionButton } from '../common/ActionButton';

export function EcologicalBuildingPanel({building}: { building: Building; }) {
    const state = useGame(s => s.state);
    const toggleStats = useUi(s => s.toggleStats);
    const energy = energyStats(state);
    const transport = transportStats(state);
    const greenProfile = greenProfileOf(building.type);
    const coveredCitizens = greenProfile ? greenSpaceCoverage(state, building) : 0;
    return <DrawerProductionPanel>
        {building.type === 'battery' && <>
            <DrawerPanelLabelValue
                label={t('eco.storage')}
                value={<>{(building.storedEnergy ?? 0).toFixed(1)} / ${ECOLOGY.batteryCapacity}</>}
            >
                ⚡ {(energy.batteryRates.get(building.id) ?? 0).toFixed(1)} / h
            </DrawerPanelLabelValue>
        </>}

        {building.type === 'solar' && <DrawerPanelLabelValue
            label={t('eco.solar')}
            value={<>{(16 * productionFactors(state.lastSeen + (state.timeOffset ?? 0)).solar).toFixed(1)} / h</>}/>}

        {building.type === 'backup' && <DrawerPanelLabelValue
            label={t('eco.backup')}
            value={<>{ECOLOGY.backupCapacity} / h</>}
        >
            {t('eco.cost')}: {ECOLOGY.backupCost} / ⚡ · {t('eco.emissions')}: 2 / ⚡
        </DrawerPanelLabelValue>}

        {greenProfile && <DrawerPanelLabelValue
            label={t('eco.greenCoverage')}
            value={coveredCitizens}
        >
            {t('eco.greenHelp')}
        </DrawerPanelLabelValue>}

        {['busStop', 'brtStation', 'railStation'].includes(building.type) && <DrawerPanelLabelValue
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
        </DrawerPanelLabelValue>}

        {building.type === 'home' && building.solar && <DrawerPanelLabelValue
            label={t('eco.solar')}
            value={<>{(2 * building.tier * productionFactors(state.lastSeen + (state.timeOffset ?? 0)).solar).toFixed(1)} /
                h</>}
        >
            <p>{t('eco.demand')}: {homePower(building).toFixed(1)}</p>
            {energy.transfers
                .filter(x => x.from === building.id || x.to === building.id)
                .map(x => <p key={`${x.from}-${x.to}`}>#{x.from} → #{x.to}: {x.amount.toFixed(2)}</p>)
            }
        </DrawerPanelLabelValue>
        }
        <ActionButton block onClick={toggleStats}>{t('eco.title')}</ActionButton>
    </DrawerProductionPanel>;
}
