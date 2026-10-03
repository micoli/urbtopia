import { Fragment } from 'react';
import { maxTierOf, missingServices, serviceCoverage, upgradeCostOf, type Building, type GoodId } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { serviceName } from './serviceNames';
import { UrbsAmount } from '../common/UrbsAmount';

interface UpgradeSectionProps {
  building: Building;
}

export function UpgradeSection({ building }: UpgradeSectionProps) {
  const urbs = useGame((store) => store.state.urbs);
  const goods = useGame((store) => store.state.storage.goods);
  const state = useGame((store) => store.state);
  const cost = building.tier < maxTierOf(building.type) ? upgradeCostOf(building.type, building.tier + 1) : undefined;
  if (!cost) return null;

  const blocking = building.type === 'home' ? missingServices(serviceCoverage(state), building, building.tier + 1) : [];
  const missing = [
    ...(urbs < cost.urbs ? [<UrbsAmount key="urbs" value={cost.urbs - urbs} />] : []),
    ...Object.entries(cost.goods).flatMap(([good, amount]) => {
      const lacking = amount - (goods[good as GoodId] ?? 0);
      return lacking > 0 ? [<Fragment key={good}>{`${lacking} ${t(`item.${good as GoodId}`)}`}</Fragment>] : [];
    }),
  ];
  return (
    <>
      <p>
        {t('home.upgrade')}: <UrbsAmount value={cost.urbs} />
        {Object.entries(cost.goods).map(([good, amount]) => ` + ${amount} ${t(`item.${good as GoodId}`)}`)}
      </p>
      {missing.length > 0 ? (
        <p className="stat-tight">
          {t('home.missing')}:{' '}
          {missing.map((item, index) => (
            <Fragment key={index}>
              {index > 0 ? ', ' : null}
              {item}
            </Fragment>
          ))}
        </p>
      ) : null}
      {blocking.length > 0 ? <p className="stat-tight">{t('home.upgradeBlocked')}: {blocking.map(serviceName).join(', ')}</p> : null}
      <button type="button" className="collect-button" disabled={blocking.length > 0} onClick={() => gameStore.getState().send({ type: 'UpgradeBuilding', buildingId: building.id })}>
        {t('home.upgrade')} → {building.tier + 1}
      </button>
    </>
  );
}
