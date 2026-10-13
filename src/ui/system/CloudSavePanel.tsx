import { useEffect, useRef } from 'react';
import { t } from '../../i18n/t';
import type { CloudStatus } from '../../persistence/cloud/cloudSync';
import type { CloudAccount, CloudSaveVersion } from '../../persistence/cloud/types';
import type { EmailCodeActions, EmailCodeState } from '../../store/cloudStore';
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
  emailCode: EmailCodeState;
  onSaveNow: () => void;
  onShowVersions: () => void;
  onRestore: (revision: number) => void;
  onDelete: () => void;
  codeActions: EmailCodeActions;
  onSignOut: () => void;
  onOpenSocial: () => void;
  focusAccount: boolean;
}

export function CloudSavePanel({ status, versions, account, emailCode, onSaveNow, onShowVersions, onRestore, onDelete, codeActions, onSignOut, onOpenSocial, focusAccount }: CloudSavePanelProps) {
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!focusAccount) return;
    section.current?.scrollIntoView({ block: 'start' });
    section.current?.focus();
  }, [focusAccount]);
  const busy = status.kind === 'syncing' || status.kind === 'conflict';
  return (
    <section className="cloud-save" ref={section} tabIndex={-1}>
      <h3>{t('cloud.title')}</h3>
      <CloudStatusLine status={status} />
      <CloudAccountSection account={account} emailCode={emailCode} codeActions={codeActions} onSignOut={onSignOut} />
      <ButtonRow align="stretch" spaced>
        <ActionButton disabled={busy} onClick={onSaveNow}>
          {t('cloud.saveNow')}
        </ActionButton>
        <ActionButton onClick={onShowVersions}>{t('cloud.versions.show')}</ActionButton>
        {account?.email ? <ActionButton onClick={onOpenSocial}>{t('cloud.openSocial')}</ActionButton> : null}
        <DeleteCloudDataButton onDelete={onDelete} />
      </ButtonRow>
      {versions ? <CloudVersionList versions={versions} onRestore={onRestore} /> : null}
    </section>
  );
}
