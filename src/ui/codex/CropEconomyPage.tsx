import { useGame } from '../common/hooks';
import { CropEconomyRules } from './CropEconomyRules';

export function CropEconomyPage() {
  const state = useGame(store => store.state);
  return <CropEconomyRules state={state} />;
}
