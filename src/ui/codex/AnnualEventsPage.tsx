import { useGame } from '../common/hooks';
import { AnnualEventsRules } from './AnnualEventsRules';

export function AnnualEventsPage() {
  const state = useGame(store => store.state);
  return <AnnualEventsRules state={state} />;
}
