import { useGame } from '../common/hooks';
import { ProductionInteriorsRules } from './ProductionInteriorsRules';

export function ProductionInteriorsPage() {
  const state = useGame(store => store.state);
  return <ProductionInteriorsRules state={state} />;
}
