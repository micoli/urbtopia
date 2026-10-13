import { useCloud, useUi } from '../common/hooks';
import { CloudSavePanel } from './CloudSavePanel';

export function CloudSaveSection() {
  const enabled = useCloud((store) => store.enabled);
  const status = useCloud((store) => store.status);
  const versions = useCloud((store) => store.versions);
  const account = useCloud((store) => store.account);
  const emailCode = useCloud((store) => store.emailCode);
  const actions = useCloud((store) => store.actions);
  const focusAccount = useUi((store) => store.signInFromSocial);
  const toggleSocial = useUi((store) => store.toggleSocial);
  if (!enabled || !actions) return null;

  return (
    <CloudSavePanel
      status={status}
      versions={versions}
      account={account}
      emailCode={emailCode}
      onSaveNow={() => void actions.syncNow()}
      onShowVersions={() => void actions.loadVersions()}
      onRestore={(revision) => void actions.restoreVersion(revision)}
      onDelete={() => void actions.deleteCloudData()}
      codeActions={{ send: (email) => void actions.sendEmailCode(email), verify: (code) => void actions.verifyEmailCode(code), cancel: actions.cancelEmailCode }}
      onSignOut={() => void actions.signOut()}
      onOpenSocial={toggleSocial}
      focusAccount={focusAccount}
    />
  );
}
