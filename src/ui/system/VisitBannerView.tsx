import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { OverlayBanner } from '../common/OverlayBanner';

interface VisitBannerViewProps {
    handle: string;
    onLeave: () => void;
}

export function VisitBannerView({handle, onLeave}: VisitBannerViewProps) {
    return <OverlayBanner variant="banner" role="alert" className="visit-banner" message={t('visit.banner').replace('{HANDLE}', handle)}>
        <ActionButton variant="primary" onClick={onLeave}>{t('visit.leave')}</ActionButton>
    </OverlayBanner>;
}
