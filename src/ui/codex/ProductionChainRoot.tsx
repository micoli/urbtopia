import type { GameState } from '../../core';
import type { ChainRoot } from '../../codex/productionChains';
import { t } from '../../i18n/t';
import { ProductionChainBuildingIcon } from './ProductionChainBuildingIcon';
import { ProductionChainItem } from './ProductionChainItem';

interface ProductionChainRootProps {
  root: ChainRoot;
  state: GameState;
}

export function ProductionChainRoot({ root, state }: ProductionChainRootProps) {
  const built = state.buildings.filter((building) => building.type === root.building).length;
  return (
    <details className="codex-chain-root" data-kind="building" open>
      <summary>
        <ProductionChainBuildingIcon building={root.building} /> <strong>{t(`building.${root.building}`)}</strong> <small>{built > 0 ? `×${built}` : t('codex.chains.notBuilt')}</small>
      </summary>
      <ul>
        {root.items.map((chain) => <ProductionChainItem key={chain.item} chain={chain} state={state} />)}
      </ul>
    </details>
  );
}
