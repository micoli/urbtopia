import type { SocialTab } from '../../store/uiStore';
import { t } from '../../i18n/t';

interface SocialTabsProps {
    tab: SocialTab;
    pending: number;
    onSelect: (tab: SocialTab) => void;
}

export function SocialTabs({tab, pending, onSelect}: SocialTabsProps) {
    return <div className="social-tabs" role="tablist" aria-label={t('social.title')}>
        <button type="button" role="tab" id="social-tab-friends" aria-selected={tab === 'friends'} aria-controls="social-panel" onClick={() => onSelect('friends')}>
            {t('social.tab.friends')}
            {pending > 0 ? <small className="social-tab-badge">{pending > 9 ? '9+' : pending}</small> : null}
        </button>
        <button type="button" role="tab" id="social-tab-exchanges" aria-selected={tab === 'exchanges'} aria-controls="social-panel" onClick={() => onSelect('exchanges')}>
            {t('social.tab.exchanges')}
        </button>
    </div>;
}
