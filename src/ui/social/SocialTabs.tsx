import type { KeyboardEvent } from 'react';
import type { SocialTab } from '../../store/uiStore';
import { t } from '../../i18n/t';

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
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (step === 0) return;
        event.preventDefault();
        const next = (ORDER.indexOf(tab) + step + ORDER.length) % ORDER.length;
        const target = ORDER[next];
        if (!target) return;
        onSelect(target);
        event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
    };
    return <div className="social-tabs" role="tablist" aria-label={t('social.title')} onKeyDown={onKeyDown}>
        {ORDER.map(id => <button key={id} type="button" role="tab" id={`social-tab-${id}`} aria-selected={tab === id} aria-controls="social-panel" tabIndex={tab === id ? 0 : -1} onClick={() => onSelect(id)}>
            {t(`social.tab.${id}`)}
            {pending[id] > 0 ? <small className="social-tab-badge">{pending[id] > 9 ? '9+' : pending[id]}</small> : null}
        </button>)}
    </div>;
}
