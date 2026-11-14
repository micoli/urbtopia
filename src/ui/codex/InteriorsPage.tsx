import { useGame } from '../common/hooks';
import { InteriorsRules } from './InteriorsRules';

export function InteriorsPage() {
  const state = useGame(store => store.state);
  return <InteriorsRules state={state} />;
}
