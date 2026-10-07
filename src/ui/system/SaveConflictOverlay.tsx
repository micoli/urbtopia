import { useCloud } from '../common/hooks';
import { SaveConflictDialog } from './SaveConflictDialog';

export function SaveConflictOverlay() {
  const status = useCloud((store) => store.status);
  const actions = useCloud((store) => store.actions);
  if (status.kind !== 'conflict' || !actions) return null;

  return <SaveConflictDialog conflict={status.conflict} onChoose={(choice) => void actions.resolveConflict(choice)} />;
}
