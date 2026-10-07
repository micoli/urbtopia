import { t } from '../../i18n/t';
import { prefsStore } from '../../i18n/prefsStore';
import type { CloudSaveVersion } from '../../persistence/cloud/types';
import { ActionButton } from '../common/ActionButton';
import { formatCloudTime } from './cloudStatusMessage';

interface CloudVersionListProps {
  versions: CloudSaveVersion[];
  onRestore: (revision: number) => void;
}

export function CloudVersionList({ versions, onRestore }: CloudVersionListProps) {
  if (versions.length === 0) return <p className="note note--muted">{t('cloud.versions.none')}</p>;
  const language = prefsStore.getState().language;
  return (
    <ul className="cloud-versions">
      {versions.map((version, index) => (
        <li key={version.revision}>
          <span>{formatCloudTime(version.clientSavedAt, language)}</span>
          {index === 0 ? (
            <span className="cloud-versions-current">{t('cloud.versions.current')}</span>
          ) : (
            <ActionButton onClick={() => onRestore(version.revision)}>{t('cloud.versions.restore')}</ActionButton>
          )}
        </li>
      ))}
    </ul>
  );
}
