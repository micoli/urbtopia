import { t } from '../../i18n/t';
import { prefsStore } from '../../i18n/prefsStore';
import type { CitySummary } from '../../persistence/cloud/cloudSync';
import { ActionButton } from '../common/ActionButton';
import { formatCloudTime } from './cloudStatusMessage';

interface ConflictCityProps {
  title: string;
  city: CitySummary;
  keepLabel: string;
  onKeep: () => void;
}

export function ConflictCity({ title, city, keepLabel, onKeep }: ConflictCityProps) {
  return (
    <div className="conflict-city">
      <h3>{title}</h3>
      <p>
        {t('cloud.conflict.citizens')} : {city.citizens}
      </p>
      <p>
        {t('cloud.conflict.savedAt')} : {formatCloudTime(city.savedAt, prefsStore.getState().language)}
      </p>
      <ActionButton variant="primary" onClick={onKeep}>
        {keepLabel}
      </ActionButton>
    </div>
  );
}
