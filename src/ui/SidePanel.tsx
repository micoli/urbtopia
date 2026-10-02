import { placementCost, GAME_CONFIG } from '../core';
import { t } from '../i18n/t';
import { useGame, useUi } from './hooks';
import { ProductionPanel } from './ProductionPanel';
import { ShopPanel } from './ShopPanel';
import { StorehousePanel } from './StorehousePanel';

export function SidePanel() {
  const selectedId = useUi((store) => store.selectedBuildingId);
  const building = useGame((store) => store.state.buildings.find((candidate) => candidate.id === selectedId) ?? null);
  const select = useUi((store) => store.select);
  const moveSelected = useUi((store) => store.moveSelected);
  const sellSelected = useUi((store) => store.sellSelected);
  if (!building) return null;

  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return (
    <aside className="side-panel">
      <header className="side-panel-header">
        <h2>{t(`building.${building.type}`)}</h2>
        <button type="button" className="panel-close" aria-label={t('panel.close')} onClick={() => select(null)}>
          ✗
        </button>
      </header>
      {building.type === 'workshop' || building.type === 'factory' ? <ProductionPanel building={building} /> : null}
      {building.type === 'shop' ? <ShopPanel building={building} /> : null}
      {building.type === 'storehouse' ? <StorehousePanel /> : null}
      <div className="side-panel-actions">
        <button type="button" onClick={moveSelected}>
          {t('panel.move')}
        </button>
        <button type="button" onClick={sellSelected}>
          {t('panel.sell')} (+{refund})
        </button>
      </div>
    </aside>
  );
}
