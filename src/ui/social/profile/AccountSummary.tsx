import { t } from '../../../i18n/t';
import type { CloudStatus } from '../../../persistence/cloud/cloudSync';
import { ActionButton } from '../../common/ActionButton';
import { CloudStatusLine } from '../../system/CloudStatusLine';

interface AccountSummaryProps {
    email: string;
    status: CloudStatus;
    onManage: () => void;
}

export function AccountSummary({email, status, onManage}: AccountSummaryProps) {
    return <section className="social-account">
        <h3>{t('profile.account.title')}</h3>
        <p>{t('cloud.account.signedIn')} <strong>{email}</strong></p>
        <CloudStatusLine status={status}/>
        <ActionButton onClick={onManage}>{t('profile.account.manage')}</ActionButton>
    </section>;
}
