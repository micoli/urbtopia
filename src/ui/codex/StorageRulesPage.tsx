import { useGame } from '../common/hooks';
import { StorageRules } from './StorageRules';

export function StorageRulesPage() {
  const state = useGame(store => store.state);
  return <StorageRules state={state} />;
}
