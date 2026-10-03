import { ECOLOGY, homePower, greenBenefits, totalCitizens, HOME_TIERS, citizensOf, taxDue, type Building } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useGame } from './hooks';
import { UpgradeSection } from './UpgradeSection';

interface HomePanelProps {
  building: Building;
}

export function HomePanel({ building }: HomePanelProps) {
  const state = useGame(s => s.state);
  const benefits = greenBenefits(state, building);
  const spec = HOME_TIERS[building.tier - 1];
  const due = taxDue(building);
  return (
    <section className="production">
      <h3>
        {t('home.tier')} {building.tier}
      </h3>
      <p>
        {t('home.citizens')}: {citizensOf(building.tier)}
      </p>
      <p>
        {t('home.demand')}: ⚡ {homePower(building).toFixed(1)} · 💧 {spec?.water ?? 0}
      </p>
      <p>
        {t('home.tax')}: {due}
      </p>
      <p>{t('eco.saved')}: {((spec?.power ?? 0) - homePower(building)).toFixed(1)} · {t('eco.wellbeing')}: {benefits.wellbeing.toFixed(1)}</p>
      {(['insulation', 'solar'] as const).map(equipment => {
        const installed = equipment === 'solar' ? building.solar : building.insulated;
        const cost = (equipment === 'solar' ? ECOLOGY.solarCost : ECOLOGY.insulationCost) * building.tier;
        return <button type="button" key={equipment} disabled={installed || state.urbs < cost || totalCitizens(state) < (equipment === 'solar' ? ECOLOGY.solarUnlockCitizens : 6)} onClick={() => gameStore.getState().send({ type: 'EquipHome', buildingId: building.id, equipment })}>
          {t(equipment === 'solar' ? 'eco.retrofit' : 'eco.insulate')} · {installed ? t('eco.installed') : `${cost} Urbs`}
        </button>;
      })}
      {totalCitizens(state) < 15 && <p>{t('eco.retrofit')} · {t('eco.locked')}: 15</p>}
      <UpgradeSection building={building} />
      {due > 0 ? (
        <button type="button" className="collect-button" onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')} (+{due})
        </button>
      ) : null}
    </section>
  );
}
