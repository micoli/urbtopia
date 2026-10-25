import { useState } from 'react';
import { isItemUnlocked, type GameState } from '../../core';
import { filterChains } from '../../codex/filterChains';
import { matchesSearch } from '../../codex/matchesSearch';
import { PRODUCTION_CHAINS } from '../../codex/productionChains';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { ProductionChainRoot } from './ProductionChainRoot';
import { ProductionChainsLegend } from './ProductionChainsLegend';
import { ProductionChainsFilter } from './ProductionChainsFilter';

interface ProductionChainsRulesProps {
  state: GameState;
}

export function ProductionChainsRules({ state }: ProductionChainsRulesProps) {
  const [query, setQuery] = useState('');
  const [unlockedOnly, setUnlockedOnly] = useState(false);
  const roots = filterChains(PRODUCTION_CHAINS, {
    searching: query.trim() !== '',
    matchesItem: (item) => matchesSearch(itemName(item), query),
    matchesBuilding: (building) => matchesSearch(t(`building.${building}`), query),
    keepItem: (item) => !unlockedOnly || isItemUnlocked(state, item),
  });
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.chains.title')}</h3>
      <p>{t('codex.chains.intro')}</p>
      <p>{t('codex.chains.legend')}</p>
      <ProductionChainsLegend />
      <ProductionChainsFilter query={query} unlockedOnly={unlockedOnly} onQuery={setQuery} onUnlockedOnly={setUnlockedOnly} />
      {roots.length === 0 ? <p className="codex-search-empty" role="status">{t('codex.searchEmpty')}</p> : null}
      <div className="codex-chain">
        {roots.map((root) => <ProductionChainRoot key={root.building} root={root} state={state} />)}
      </div>
    </>
  );
}
