import { STORAGE_UPGRADE_COSTS, storageCapacity, storageUsed, type GoodId, type MaterialId } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useGame } from './hooks';

export function StorehousePanel() {
  const state = useGame((store) => store.state);
  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  const materials = Object.entries(state.storage.materials).filter(([, amount]) => (amount ?? 0) > 0);
  const goods = Object.entries(state.storage.goods).filter(([, amount]) => (amount ?? 0) > 0);
  const upgradeCost = STORAGE_UPGRADE_COSTS[state.storehouseLevel];

  return (
    <section className="storehouse">
      <h3>
        {t('panel.stock')} · {t('panel.level')} {state.storehouseLevel}
      </h3>
      <p>
        {t('panel.materials')}: {used.materials}/{capacity.materials}
      </p>
      <ul>
        {materials.map(([item, amount]) => (
          <li key={item}>
            {t(`item.${item as MaterialId}`)} × {amount}
          </li>
        ))}
      </ul>
      <p>
        {t('panel.goods')}: {used.goods}/{capacity.goods}
      </p>
      <ul>
        {goods.map(([item, amount]) => (
          <li key={item}>
            {t(`item.${item as GoodId}`)} × {amount}
          </li>
        ))}
      </ul>
      {upgradeCost !== undefined ? (
        <button type="button" className="slot-buy" onClick={() => gameStore.getState().send({ type: 'UpgradeStorehouse' })}>
          {t('panel.upgrade')} ({upgradeCost} {t('stat.urbs')})
        </button>
      ) : null}
    </section>
  );
}
