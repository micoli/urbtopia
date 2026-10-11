import { t } from '../../i18n/t';
import type { CloudAccount } from '../../persistence/cloud/types';
import type { EmailCodeActions, EmailCodeState } from '../../store/cloudStore';
import { ActionButton } from '../common/ActionButton';
import { EmailCodeForm } from './EmailCodeForm';

interface CloudAccountSectionProps {
  account: CloudAccount | null;
  emailCode: EmailCodeState;
  codeActions: EmailCodeActions;
  onSignOut: () => void;
}

export function CloudAccountSection({ account, emailCode, codeActions, onSignOut }: CloudAccountSectionProps) {
  if (!account) return null;
  if (!account.email) return <EmailCodeForm state={emailCode} actions={codeActions} />;

  return (
    <div className="cloud-account">
      <p>
        {t('cloud.account.signedIn')} <strong>{account.email}</strong>
      </p>
      <ActionButton onClick={onSignOut}>{t('cloud.account.signOut')}</ActionButton>
    </div>
  );
}
