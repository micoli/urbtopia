import { useGame } from '../common/hooks';
import { EnergyProductionRules } from './EnergyProductionRules';

export function EnergyProductionPage() {
  const state = useGame(store => store.state);
  return <EnergyProductionRules state={state} />;
}
