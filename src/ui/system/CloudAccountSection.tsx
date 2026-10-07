import { t } from '../../i18n/t';
import type { CloudAccount } from '../../persistence/cloud/types';
import type { EmailLinkState } from '../../store/cloudStore';
import { ActionButton } from '../common/ActionButton';
import { EmailLinkForm } from './EmailLinkForm';

interface CloudAccountSectionProps {
  account: CloudAccount | null;
  emailLink: EmailLinkState;
  onSendLink: (email: string) => void;
  onSignOut: () => void;
}

export function CloudAccountSection({ account, emailLink, onSendLink, onSignOut }: CloudAccountSectionProps) {
  if (!account) return null;
  if (!account.email) return <EmailLinkForm state={emailLink} onSend={onSendLink} />;

  return (
    <div className="cloud-account">
      <p>
        {t('cloud.account.signedIn')} <strong>{account.email}</strong>
      </p>
      <ActionButton onClick={onSignOut}>{t('cloud.account.signOut')}</ActionButton>
    </div>
  );
}
