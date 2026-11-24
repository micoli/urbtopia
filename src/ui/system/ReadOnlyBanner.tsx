import { resumeHandle } from '../../persistence/install';
import { t } from '../../i18n/t';
import { cloudStore } from '../../store/cloudStore';
import { useReadOnly, useReadOnlyReason, useShowcase } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { OverlayBanner } from '../common/OverlayBanner';

export function ReadOnlyBanner() {
  const readOnly = useReadOnly();
  const reason = useReadOnlyReason();
  const visiting = useShowcase((s) => s.visit.kind === 'visiting');
  if (!readOnly || visiting) return null;

  if (reason === 'device') {
    return (
      <OverlayBanner variant="banner" role="alert" message={t('device.readOnly')}>
        <ActionButton size="sm" overlay onClick={() => void cloudStore.getState().actions?.takeOver()}>{t('device.takeOver')}</ActionButton>
      </OverlayBanner>
    );
  }

  return (
    <OverlayBanner variant="banner" role="alert" message={t('tab.readOnly')}>
      <ActionButton size="sm" overlay onClick={() => resumeHandle.current()}>{t('tab.resume')}</ActionButton>
    </OverlayBanner>
  );
}
