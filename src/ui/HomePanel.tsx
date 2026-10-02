import { HOME_TIERS, citizensOf, taxDue, type Building } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';

interface HomePanelProps {
  building: Building;
}

export function HomePanel({ building }: HomePanelProps) {
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
        {t('home.demand')}: ⚡ {spec?.power ?? 0} · 💧 {spec?.water ?? 0}
      </p>
      <p>
        {t('home.tax')}: {due}
      </p>
      {due > 0 ? (
        <button type="button" className="collect-button" onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')} (+{due})
        </button>
      ) : null}
    </section>
  );
}
