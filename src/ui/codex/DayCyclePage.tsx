import { useGame } from '../common/hooks';
import { DayCycleRules } from './DayCycleRules';

export function DayCyclePage() {
  const state = useGame(store => store.state);
  return <DayCycleRules state={state} />;
}
