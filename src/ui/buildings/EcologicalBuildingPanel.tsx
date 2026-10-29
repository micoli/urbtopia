import {
    ECOLOGY,
    greenProfileOf,
    energyStats,
    greenSpaceCoverage,
    homePower,
    energySavingOf,
    solarPanelsCapacity,
    transportStats,
    isTransitStopType,
    type Building, isHomeType } from '../../core';
import {lineStatusKey} from '../stats/management/transit/lineStatusKey';
import {t} from '../../i18n/t';
import {useGame} from '../common/hooks';
import {factorsAt, productionFactors} from '../../core/environment/energy';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';

export function EcologicalBuildingPanel({building}: { building: Building; }) {
    const state = useGame(s => s.state);
    const energy = energyStats(state);
    const transport = transportStats(state);
    const greenProfile = greenProfileOf(building.type, building.tier);
    const coveredCitizens = greenProfile ? greenSpaceCoverage(state, building) : 0;
    return <DrawerPanel>
        {building.type === 'battery' && <>
            <DrawerPanel.LabelValue
                label={t('eco.storage')}
                value={<>{(building.storedEnergy ?? 0).toFixed(1)} / ${ECOLOGY.batteryCapacity}</>}
            >
                <Icon name="power" /> {(energy.batteryRates.get(building.id) ?? 0).toFixed(1)} / h
            </DrawerPanel.LabelValue>
        </>}

        {building.type === 'solar' && <DrawerPanel.LabelValue
            label={t('eco.solar')}
            value={<>{(16 * factorsAt(state, state.lastSeen).solar).toFixed(1)} / h</>}/>}

        {building.type === 'backup' && <DrawerPanel.LabelValue
            label={t('eco.backup')}
            value={<>{ECOLOGY.backupCapacity} / h</>}
        >
            {t('eco.cost')}: {ECOLOGY.backupCost} / <Icon name="power" /> · {t('eco.emissions')}: 2 / <Icon name="power" />
        </DrawerPanel.LabelValue>}

        {greenProfile && <DrawerPanel.LabelValue
            label={t('eco.greenCoverage')}
            value={coveredCitizens}
        >
            {t('eco.greenHelp')}
        </DrawerPanel.LabelValue>}


        {isTransitStopType(building.type) && <DrawerPanel.LabelValue
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

        {building.solar && <DrawerPanel.LabelValue
            label={t('eco.solar')}
            value={<>{(solarPanelsCapacity(building) * productionFactors(state.lastSeen + (state.timeOffset ?? 0)).solar).toFixed(1)} /
                h</>}
        >
            {isHomeType(building.type) && <p>{t('eco.demand')}: {homePower(building, energySavingOf(state)).toFixed(1)}</p>}
            {energy.transfers
                .filter(x => x.from === building.id || x.to === building.id)
                .map(x => <p key={`${x.from}-${x.to}`}>#{x.from} → #{x.to}: {x.amount.toFixed(2)}</p>)
            }
        </DrawerPanel.LabelValue>
        }
    </DrawerPanel>;
}
