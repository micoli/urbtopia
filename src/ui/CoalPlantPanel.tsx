import { COAL_CAPACITY, ECOLOGY, energyStats, type Building } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useGame } from './hooks';
import { UpgradeSection } from './UpgradeSection';

export function CoalPlantPanel({ building }: { building: Building }) {
  const state = useGame(s => s.state);
  const energy = energyStats(state);
  const delivered = energy.coalRates.get(building.id) ?? 0;
  const enabled = building.coalEnabled !== false;
  return <section className="production">
    <h3>{t('home.tier')} {building.tier}</h3>
    <p>{t('eco.nominal')}: {COAL_CAPACITY[building.tier - 1] ?? 0}</p>
    <p>{t('eco.coal')}: {delivered.toFixed(2)} / h</p>
    <p>{t('eco.cost')}: {(delivered * ECOLOGY.coalCost).toFixed(2)} · {t('eco.coalRate')}: {ECOLOGY.coalCost}</p>
    <p>{t('eco.emissions')}: {(delivered * ECOLOGY.coalEmissions).toFixed(2)}</p>
    <p>{t('eco.coalHelp')}</p>
    <p>{t('eco.coalPollutionHelp')}</p>
    {enabled && state.urbs <= 1e-9 && <p>{t('eco.coalUnpaid')}</p>}
    <button type="button" className="collect-button" role="switch" aria-label={t('eco.coalEnabled')} aria-checked={enabled} onClick={() => gameStore.getState().send({ type: 'SetCoalEnabled', buildingId: building.id, enabled: !enabled })}>
      {t(enabled ? 'eco.coalStop' : 'eco.coalStart')}
    </button>
    <UpgradeSection building={building} />
  </section>;
}
