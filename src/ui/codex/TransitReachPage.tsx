import { useGame } from '../common/hooks';
import { TransitReachRules } from './TransitReachRules';

export function TransitReachPage() {
  const state = useGame(store => store.state);
  return <TransitReachRules state={state} />;
}
