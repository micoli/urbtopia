import { HOME_TIERS, HOME_UPGRADE_COSTS, MAX_HOME_TIER, citizensOf, taxDue, type Building, type GoodId } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';

interface HomePanelProps {
  building: Building;
}

export function HomePanel({ building }: HomePanelProps) {
  const spec = HOME_TIERS[building.tier - 1];
  const due = taxDue(building);
  const nextCost = building.tier < MAX_HOME_TIER ? HOME_UPGRADE_COSTS[building.tier + 1] : undefined;
  return (
    <section className="production">
      <h3>
        {t('home.tier')} {building.tier}
      </h3>
      <p>
        {t('home.citizens')}: {citizensOf(building.tier)}
      </p>
      <p>
        {t('home.demand')}: ⚡ {spec?.power ?? 0} · 💧 {spec?.water ?? 0}
      </p>
      <p>
        {t('home.tax')}: {due}
      </p>
      {nextCost ? (
        <>
          <p>
            {t('home.upgrade')}: {nextCost.urbs} {t('stat.urbs')}
            {Object.entries(nextCost.goods).map(([good, amount]) => ` + ${amount} ${t(`item.${good as GoodId}`)}`)}
          </p>
          <button type="button" className="collect-button" onClick={() => gameStore.getState().send({ type: 'UpgradeHome', buildingId: building.id })}>
            {t('home.upgrade')} → {building.tier + 1}
          </button>
        </>
      ) : null}
      {due > 0 ? (
        <button type="button" className="collect-button" onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')} (+{due})
        </button>
      ) : null}
    </section>
  );
}
