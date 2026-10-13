import type { SocialTab } from '../../store/uiStore';
import { t } from '../../i18n/t';

interface SocialTabsProps {
    tab: SocialTab;
    friendsPending: number;
    exchangesPending: number;
    onSelect: (tab: SocialTab) => void;
}

export function SocialTabs({tab, friendsPending, exchangesPending, onSelect}: SocialTabsProps) {
    return <div className="social-tabs" role="tablist" aria-label={t('social.title')}>
        <button type="button" role="tab" id="social-tab-exchanges" aria-selected={tab === 'exchanges'} aria-controls="social-panel" onClick={() => onSelect('exchanges')}>
            {t('social.tab.exchanges')}
            {exchangesPending > 0 ? <small className="social-tab-badge">{exchangesPending > 9 ? '9+' : exchangesPending}</small> : null}
        </button>
        <button type="button" role="tab" id="social-tab-friends" aria-selected={tab === 'friends'} aria-controls="social-panel" onClick={() => onSelect('friends')}>
            {t('social.tab.friends')}
            {friendsPending > 0 ? <small className="social-tab-badge">{friendsPending > 9 ? '9+' : friendsPending}</small> : null}
        </button>
        <button type="button" role="tab" id="social-tab-profile" aria-selected={tab === 'profile'} aria-controls="social-panel" onClick={() => onSelect('profile')}>
            {t('social.tab.profile')}
        </button>
    </div>;
}
