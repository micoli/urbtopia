import { COAL_CAPACITY, ECOLOGY, energyStats, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';

export function CoalPlantPanel({ building }: { building: Building }) {
  const state = useGame(s => s.state);
  const energy = energyStats(state);
  const delivered = energy.coalRates.get(building.id) ?? 0;
  const enabled = building.coalEnabled !== false;
  return <DrawerPanel>
    <DrawerPanel.LabelValue label={t('eco.nominal')} value={COAL_CAPACITY[building.tier - 1] ?? 0}/>
    <DrawerPanel.LabelValue label={t('eco.coal')} value={`${delivered.toFixed(2)} / h`}/>
    <DrawerPanel.LabelValue label={t('eco.cost')} value={`${(delivered * ECOLOGY.coalCost).toFixed(2)} · ${t('eco.coalRate')}: ${ECOLOGY.coalCost}`}/>
    <DrawerPanel.LabelValue label={t('eco.emissions')} value={(delivered * ECOLOGY.coalEmissions).toFixed(2)}/>
    <p><strong>{t('eco.coalHelp')}</strong></p>
    <p><strong>{t('eco.coalPollutionHelp')}</strong></p>
    {enabled && state.urbs <= 1e-9 && <p>{t('eco.coalUnpaid')}</p>}
    <ActionButton variant="primary" block role="switch" aria-label={t('eco.coalEnabled')} aria-checked={enabled} onClick={() => gameStore.getState().send({ type: 'SetCoalEnabled', buildingId: building.id, enabled: !enabled })}>
      {t(enabled ? 'eco.coalStop' : 'eco.coalStart')}
    </ActionButton>
    <DrawerPanel.Upgrade building={building} />
  </DrawerPanel>;
}
