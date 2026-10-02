import { storageCapacity, storageUsed } from '../core';
import { t } from '../i18n/t';
import { useGame } from './hooks';

export function StorehousePanel() {
  const state = useGame((store) => store.state);
  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  const materials = Object.entries(state.storage.materials).filter(([, amount]) => (amount ?? 0) > 0);

  return (
    <section className="storehouse">
      <h3>{t('panel.stock')}</h3>
      <p>
        {t('panel.materials')}: {used.materials}/{capacity.materials}
      </p>
      <ul>
        {materials.map(([item, amount]) => (
          <li key={item}>
            {t(`item.${item as 'wood' | 'stone'}`)} × {amount}
          </li>
        ))}
      </ul>
      <p>
        {t('panel.goods')}: {used.goods}/{capacity.goods}
      </p>
    </section>
  );
}
