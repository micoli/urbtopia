import { useGame } from '../common/hooks';
import { ProductionChainsRules } from './ProductionChainsRules';

export function ProductionChainsPage() {
  const state = useGame(store => store.state);
  return <ProductionChainsRules state={state} />;
}
