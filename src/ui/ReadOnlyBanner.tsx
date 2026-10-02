import { resumeHandle } from '../persistence/install';
import { t } from '../i18n/t';
import { useReadOnly } from './hooks';

export function ReadOnlyBanner() {
  const readOnly = useReadOnly();
  if (!readOnly) return null;

  return (
    <div className="banner" role="alert">
      <span>{t('tab.readOnly')}</span>
      <button type="button" onClick={() => resumeHandle.current()}>
        {t('tab.resume')}
      </button>
    </div>
  );
}
