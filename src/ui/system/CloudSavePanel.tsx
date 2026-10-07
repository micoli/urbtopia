import { t } from '../../i18n/t';
import type { CloudStatus } from '../../persistence/cloud/cloudSync';
import type { CloudSaveVersion } from '../../persistence/cloud/types';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { CloudStatusLine } from './CloudStatusLine';
import { CloudVersionList } from './CloudVersionList';
import { DeleteCloudDataButton } from './DeleteCloudDataButton';

interface CloudSavePanelProps {
  status: CloudStatus;
  versions: CloudSaveVersion[] | null;
  onSaveNow: () => void;
  onShowVersions: () => void;
  onRestore: (revision: number) => void;
  onDelete: () => void;
}

export function CloudSavePanel({ status, versions, onSaveNow, onShowVersions, onRestore, onDelete }: CloudSavePanelProps) {
  const busy = status.kind === 'syncing' || status.kind === 'conflict';
  return (
    <section className="cloud-save">
      <h3>{t('cloud.title')}</h3>
      <CloudStatusLine status={status} />
      <ButtonRow align="stretch" spaced>
        <ActionButton disabled={busy} onClick={onSaveNow}>
          {t('cloud.saveNow')}
        </ActionButton>
        <ActionButton onClick={onShowVersions}>{t('cloud.versions.show')}</ActionButton>
        <DeleteCloudDataButton onDelete={onDelete} />
      </ButtonRow>
      {versions ? <CloudVersionList versions={versions} onRestore={onRestore} /> : null}
    </section>
  );
}
