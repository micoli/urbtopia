import { t } from '../../i18n/t';
import type { CloudStatus } from '../../persistence/cloud/cloudSync';
import type { CloudAccount, CloudSaveVersion } from '../../persistence/cloud/types';
import type { EmailLinkState } from '../../store/cloudStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { CloudAccountSection } from './CloudAccountSection';
import { CloudStatusLine } from './CloudStatusLine';
import { CloudVersionList } from './CloudVersionList';
import { DeleteCloudDataButton } from './DeleteCloudDataButton';

interface CloudSavePanelProps {
  status: CloudStatus;
  versions: CloudSaveVersion[] | null;
  account: CloudAccount | null;
  emailLink: EmailLinkState;
  onSaveNow: () => void;
  onShowVersions: () => void;
  onRestore: (revision: number) => void;
  onDelete: () => void;
  onSendLink: (email: string) => void;
  onSignOut: () => void;
}

export function CloudSavePanel({ status, versions, account, emailLink, onSaveNow, onShowVersions, onRestore, onDelete, onSendLink, onSignOut }: CloudSavePanelProps) {
  const busy = status.kind === 'syncing' || status.kind === 'conflict';
  return (
    <section className="cloud-save">
      <h3>{t('cloud.title')}</h3>
      <CloudStatusLine status={status} />
      <CloudAccountSection account={account} emailLink={emailLink} onSendLink={onSendLink} onSignOut={onSignOut} />
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
