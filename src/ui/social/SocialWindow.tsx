import { pendingSocialCount } from '../../social/pendingCount';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';
import { useSocial, useUi } from '../common/hooks';
import { useModalFocus } from '../stats/management/useModalFocus';
import { ExchangesTab } from './ExchangesTab';
import { FriendsTab } from './friends/FriendsTab';
import { SocialTabs } from './SocialTabs';

export function SocialWindow() {
    const open = useUi(s => s.socialOpen);
    const toggle = useUi(s => s.toggleSocial);
    const tab = useUi(s => s.socialTab);
    const setTab = useUi(s => s.setSocialTab);
    const pending = useSocial(s => pendingSocialCount(s.profile));
    const panel = useModalFocus(open, toggle);
    if (!open) return null;
    return <div className="dialog-backdrop city-management-backdrop" onClick={event => {
        if (event.target === event.currentTarget) toggle();
    }}>
        <div className="eco-dashboard social-window" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="social-heading">
            <header className="eco-header">
                <img src={`${import.meta.env.BASE_URL}assets/icons/social-network.png`} alt=""/>
                <h2 id="social-heading">{t('social.title')}</h2>
                <CloseButton onClick={toggle}/>
            </header>
            <SocialTabs tab={tab} pending={pending} onSelect={setTab}/>
            <div id="social-panel" role="tabpanel" aria-labelledby={`social-tab-${tab}`}>
                {tab === 'friends' ? <FriendsTab/> : <ExchangesTab/>}
            </div>
        </div>
    </div>;
}
