import { useGame } from '../common/hooks';
import { WasteRules } from './WasteRules';

export function WastePage() {
  const state = useGame(store => store.state);
  return <WasteRules state={state} />;
}
