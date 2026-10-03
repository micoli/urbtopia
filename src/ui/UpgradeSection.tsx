import { maxTierOf, upgradeCostOf, type Building, type GoodId } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useGame } from './hooks';

interface UpgradeSectionProps {
  building: Building;
}

export function UpgradeSection({ building }: UpgradeSectionProps) {
  const urbs = useGame((store) => store.state.urbs);
  const goods = useGame((store) => store.state.storage.goods);
  const cost = building.tier < maxTierOf(building.type) ? upgradeCostOf(building.type, building.tier + 1) : undefined;
  if (!cost) return null;

  const missing = [
    ...(urbs < cost.urbs ? [`${cost.urbs - urbs} ${t('stat.urbs')}`] : []),
    ...Object.entries(cost.goods).flatMap(([good, amount]) => {
      const lacking = amount - (goods[good as GoodId] ?? 0);
      return lacking > 0 ? [`${lacking} ${t(`item.${good as GoodId}`)}`] : [];
    }),
  ];
  return (
    <>
      <p>
        {t('home.upgrade')}: {cost.urbs} {t('stat.urbs')}
        {Object.entries(cost.goods).map(([good, amount]) => ` + ${amount} ${t(`item.${good as GoodId}`)}`)}
      </p>
      {missing.length > 0 ? (
        <p className="stat-tight">
          {t('home.missing')}: {missing.join(', ')}
        </p>
      ) : null}
      <button type="button" className="collect-button" onClick={() => gameStore.getState().send({ type: 'UpgradeBuilding', buildingId: building.id })}>
        {t('home.upgrade')} → {building.tier + 1}
      </button>
    </>
  );
}
