import { useGame } from '../common/hooks';
import { ServiceInteriorsRules } from './ServiceInteriorsRules';

export function ServiceInteriorsPage() {
  const state = useGame(store => store.state);
  return <ServiceInteriorsRules state={state} />;
}
