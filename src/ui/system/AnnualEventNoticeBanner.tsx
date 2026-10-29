import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { OverlayBanner } from '../common/OverlayBanner';

interface AnnualEventNoticeBannerProps {
  eventName: string;
  endDate: string;
  onSee: () => void;
  onDismiss: () => void;
}

export function AnnualEventNoticeBanner({ eventName, endDate, onSee, onDismiss }: AnnualEventNoticeBannerProps) {
  return (
    <OverlayBanner variant="banner" message={t('annualEvent.notice').replace('{event}', eventName).replace('{date}', endDate)}>
      <ActionButton size="sm" overlay onClick={onSee}>{t('annualEvent.notice.see')}</ActionButton>
      <ActionButton size="sm" overlay onClick={onDismiss}>{t('hint.dismiss')}</ActionButton>
    </OverlayBanner>
  );
}
