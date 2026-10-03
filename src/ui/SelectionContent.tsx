import { GAME_CONFIG, isStorageType, placementCost } from '../core';
import { t } from '../i18n/t';
import { HomePanel } from './HomePanel';
import { useUi } from './hooks';
import { ProductionPanel } from './ProductionPanel';
import { ShopPanel } from './ShopPanel';
import { StoragePanel } from './StoragePanel';
import { useSelectedBuilding } from './useSelectedBuilding';
import { UtilityPanel } from './UtilityPanel';

export function SelectionContent() {
  const building = useSelectedBuilding();
  const select = useUi((store) => store.select);
  const moveSelected = useUi((store) => store.moveSelected);
  const sellSelected = useUi((store) => store.sellSelected);
  if (!building) return null;

  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return (
    <>
      <header className="side-panel-header">
        <h2>{t(`building.${building.type}`)}</h2>
        <button type="button" className="panel-close" aria-label={t('panel.close')} onClick={() => select(null)}>
          ✗
        </button>
      </header>
      {building.type === 'workshop' || building.type === 'factory' ? <ProductionPanel building={building} /> : null}
      {building.type === 'home' ? <HomePanel building={building} /> : null}
      {building.type === 'shop' ? <ShopPanel building={building} /> : null}
      {isStorageType(building.type) ? <StoragePanel building={building} /> : null}
      {building.type === 'powerPlant' || building.type === 'waterTower' ? <UtilityPanel building={building} type={building.type} /> : null}
      <div className="side-panel-actions">
        <button type="button" onClick={moveSelected}>
          {t('panel.move')}
        </button>
        <button type="button" onClick={sellSelected}>
          {t('panel.sell')} (+{refund})
        </button>
      </div>
    </>
  );
}
