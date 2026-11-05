import { useGame } from '../common/hooks';
import { ClimateRules } from './ClimateRules';

export function ClimatePage() {
  const state = useGame(store => store.state);
  return <ClimateRules state={state} />;
}
