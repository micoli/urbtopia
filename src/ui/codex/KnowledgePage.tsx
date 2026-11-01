import { useGame } from '../common/hooks';
import { KnowledgeRules } from './KnowledgeRules';

export function KnowledgePage() {
  const state = useGame(store => store.state);
  return <KnowledgeRules state={state} />;
}
