import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { OverlayBanner } from '../common/OverlayBanner';

interface VisitBannerViewProps {
    handle: string;
    cityName: string;
    onLeave: () => void;
}

export function VisitBannerView({handle, cityName, onLeave}: VisitBannerViewProps) {
    return <OverlayBanner variant="banner" role="alert" className="visit-banner" message={t('visit.banner').replace('{HANDLE}', handle).replace('{CITY}', cityName)}>
        <ActionButton variant="primary" onClick={onLeave}>{t('visit.leave')}</ActionButton>
    </OverlayBanner>;
}
