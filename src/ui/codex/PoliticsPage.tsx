import { useGame } from '../common/hooks';
import { PoliticsRules } from './PoliticsRules';

export function PoliticsPage() {
  const state = useGame(store => store.state);
  return <PoliticsRules state={state} />;
}
