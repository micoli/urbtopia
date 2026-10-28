import { isItemUnlocked, isGood, type GameState } from '../../core';
import { isDeadEnd, type ChainItem } from '../../codex/productionChains';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { ProductionChainItemIcon } from './ProductionChainItemIcon';
import { ProductionChainChannels } from './ProductionChainChannels';
import { ProductionChainStep } from './ProductionChainStep';
import { Icon } from '../common/Icon';

interface ProductionChainItemProps {
  chain: ChainItem;
  state: GameState;
}

export function ProductionChainItem({ chain, state }: ProductionChainItemProps) {
  const { item } = chain;
  const stock = Math.floor((isGood(item) ? state.storage.goods[item] : state.storage.materials[item]) ?? 0);
  const unlocked = isItemUnlocked(state, item);
  return (
    <li className="codex-chain-item" data-kind={isGood(item) ? 'good' : 'material'} data-unlocked={unlocked}>
      <ProductionChainItemIcon item={item} />
      <span className="codex-chain-name">{itemName(item)}</span>
      {chain.alsoAs.length > 0 ? <small>{t('codex.chains.alsoAs')} {chain.alsoAs.map(itemName).join(', ')}</small> : null}
      <small>{unlocked ? `${t('codex.chains.stock')} ${stock}` : <><Icon name="lock" /> {t('codex.chains.locked')}</>}</small>
      {isDeadEnd(chain) ? <small className="codex-chain-warning">{t('codex.chains.deadEnd')}</small> : null}
      <ProductionChainChannels channels={chain.soldAt} isGood={isGood(item)} />
      {chain.steps.length > 0 ? (
        <ul className="codex-chain-steps">
          {chain.steps.map((step) => <ProductionChainStep key={step.building} step={step} state={state} />)}
        </ul>
      ) : null}
    </li>
  );
}
