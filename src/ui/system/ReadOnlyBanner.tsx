import { resumeHandle } from '../../persistence/install';
import { t } from '../../i18n/t';
import { useReadOnly } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { OverlayBanner } from '../common/OverlayBanner';

export function ReadOnlyBanner() {
  const readOnly = useReadOnly();
  if (!readOnly) return null;

  return (
    <OverlayBanner variant="banner" role="alert" message={t('tab.readOnly')}>
      <ActionButton onClick={() => resumeHandle.current()}>{t('tab.resume')}</ActionButton>
    </OverlayBanner>
  );
}
