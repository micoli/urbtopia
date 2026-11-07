import { GOODS, MATERIALS, donationValue, type GoodId, type MaterialId } from '../../core';
import { t } from '../../i18n/t';
import { useGame, useUi } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { MarketGoodRow } from './MarketGoodRow';
import { MarketMaterialRow } from './MarketMaterialRow';
import { SolidarityStatus } from './SolidarityStatus';

export function MarketContent() {
  const state = useGame((store) => store.state);
  const openCodex = useUi((store) => store.openCodex);
  const goods = (Object.keys(GOODS) as GoodId[]).filter((good) => (state.storage.goods[good] ?? 0) > 0);
  const materials = (Object.keys(MATERIALS) as MaterialId[]).filter((material) => donationValue(material, state.storage.materials[material] ?? 0) > 0);

  return (
    <>
      <SolidarityStatus />
      {goods.length === 0 && materials.length === 0 ? <p>{t('market.empty')}</p> : null}
      <ul className="market-list">
        {goods.map(good => <MarketGoodRow key={good} good={good} />)}
        {materials.map(material => <MarketMaterialRow key={material} material={material} />)}
      </ul>
      <ActionButton className="market-rules" onClick={() => openCodex(undefined, 'market')}>{t('codex.market.open')}</ActionButton>
    </>
  );
}
