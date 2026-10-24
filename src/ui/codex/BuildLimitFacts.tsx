import type { CodexId } from '../../codex/catalog';
import { useGame } from '../common/hooks';
import { BuildLimitList } from './BuildLimitList';

export function BuildLimitFacts({ id }: { id: CodexId }) {
  const state = useGame(store => store.state);
  return <BuildLimitList id={id} state={state} />;
}
