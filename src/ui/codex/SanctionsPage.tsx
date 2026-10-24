import { useGame } from '../common/hooks';
import { SanctionsRules } from './SanctionsRules';

export function SanctionsPage() {
  const state = useGame(store => store.state);
  return <SanctionsRules state={state} />;
}
