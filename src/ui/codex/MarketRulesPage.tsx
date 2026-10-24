import { useGame } from '../common/hooks';
import { MarketRules } from './MarketRules';

export function MarketRulesPage() {
  const state = useGame(store => store.state);
  return <MarketRules state={state} />;
}
