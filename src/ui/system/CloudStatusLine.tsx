import { t } from '../../i18n/t';
import { prefsStore } from '../../i18n/prefsStore';
import type { CloudStatus } from '../../persistence/cloud/cloudSync';
import { cloudStatusMessageKey, formatCloudTime } from './cloudStatusMessage';

interface CloudStatusLineProps {
  status: CloudStatus;
}

export function CloudStatusLine({ status }: CloudStatusLineProps) {
  return (
    <p className={`cloud-status cloud-status--${status.kind}`} role="status">
      {t(cloudStatusMessageKey(status))}
      {status.kind === 'synced' ? ` · ${t('cloud.lastSync')} ${formatCloudTime(status.at, prefsStore.getState().language)}` : null}
    </p>
  );
}
