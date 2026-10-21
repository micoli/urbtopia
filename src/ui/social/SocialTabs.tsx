import type { SocialTab } from '../../store/uiStore';
import { t } from '../../i18n/t';
import { Tabs } from '../common/Tabs';

interface SocialTabsProps {
    tab: SocialTab;
    friendsPending: number;
    groupsPending: number;
    exchangesPending: number;
    onSelect: (tab: SocialTab) => void;
}

const ORDER: SocialTab[] = ['friends', 'groups', 'exchanges', 'profile'];

export function SocialTabs({tab, friendsPending, groupsPending, exchangesPending, onSelect}: SocialTabsProps) {
    const pending: Record<SocialTab, number> = {friends: friendsPending, groups: groupsPending, exchanges: exchangesPending, profile: 0};
    const tabs = ORDER.map(id => ({id, label: t(`social.tab.${id}`), count: pending[id]}));
    return <Tabs label={t('social.title')} idPrefix="social-tab" panelId="social-panel" tabs={tabs} selected={tab} onSelect={onSelect}/>;
}
