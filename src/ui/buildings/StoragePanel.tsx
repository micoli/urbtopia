import { compartmentOf, storageTierOf, isStorageType, storageCapacity, storageUsed, type Building, type GoodId, type MaterialId } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { useGame } from '../common/hooks';
import { DrawerPanel } from '../common/DrawerPanel';

interface StoragePanelProps {
  building: Building;
}

type Compartment = 'materials' | 'crops' | 'goods';

export function StoragePanel({ building }: StoragePanelProps) {
  const state = useGame((store) => store.state);
  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  const stocked = Object.entries(state.storage.materials).filter(([, amount]) => (amount ?? 0) > 0);
  const stock: Record<Compartment, [string, number | undefined][]> = {
    materials: stocked.filter(([item]) => compartmentOf(item) === 'materials'),
    crops: stocked.filter(([item]) => compartmentOf(item) === 'crops'),
    goods: Object.entries(state.storage.goods).filter(([, amount]) => (amount ?? 0) > 0),
  };
  const compartments = (['materials', 'crops', 'goods'] as const).filter((compartment) => isStorageType(building.type) && storageTierOf(building.type, building.tier)[compartment] > 0);

  return (
    <DrawerPanel>
      {compartments.map((compartment) => (
        <div key={compartment}>
          <p>
            {t(`panel.${compartment}`)}: {used[compartment]}/{capacity[compartment]}
          </p>
          <ul>
            {stock[compartment].map(([item, amount]) => (
              <li key={item}>
                {compartment === 'goods' ? itemName(item as GoodId) : t(`item.${item as MaterialId}`)} × {amount}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <DrawerPanel.Upgrade building={building} />
    </DrawerPanel>
  );
}
