import { useCloud } from '../common/hooks';
import { CloudSavePanel } from './CloudSavePanel';

export function CloudSaveSection() {
  const enabled = useCloud((store) => store.enabled);
  const status = useCloud((store) => store.status);
  const versions = useCloud((store) => store.versions);
  const actions = useCloud((store) => store.actions);
  if (!enabled || !actions) return null;

  return (
    <CloudSavePanel
      status={status}
      versions={versions}
      onSaveNow={() => void actions.syncNow()}
      onShowVersions={() => void actions.loadVersions()}
      onRestore={(revision) => void actions.restoreVersion(revision)}
      onDelete={() => void actions.deleteCloudData()}
    />
  );
}
