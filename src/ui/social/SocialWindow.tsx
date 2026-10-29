import { pendingExchangesCount, pendingFriendsCount, pendingGroupsCount } from '../../social/pendingCount';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';
import { useCloud, useSocial, useUi } from '../common/hooks';
import { useModalFocus } from '../stats/management/useModalFocus';
import { useBackdropClose } from '../common/useBackdropClose';
import { ExchangesTab } from './ExchangesTab';
import { FriendsTab } from './friends/FriendsTab';
import { HallOfFameTab } from './hall/HallOfFameTab';
import { GroupsTab } from './groups/GroupsTab';
import { ProfileTab } from './profile/ProfileTab';
import { SignInPrompt } from './SignInPrompt';
import { SocialTabs } from './SocialTabs';

export function SocialWindow() {
    const open = useUi(s => s.socialOpen);
    const toggle = useUi(s => s.toggleSocial);
    const tab = useUi(s => s.socialTab);
    const setTab = useUi(s => s.setSocialTab);
    const friendsPending = useSocial(s => pendingFriendsCount(s.profile));
    const groupsPending = useSocial(s => pendingGroupsCount(s.groups));
    const exchangesPending = useSocial(s => pendingExchangesCount(s.profile));
    const account = useCloud(s => s.account);
    const openSettings = useUi(s => s.openSettingsFromSocial);
    const panel = useModalFocus(open, toggle);
    const backdrop = useBackdropClose(toggle);
    if (!open) return null;
    return <div className="dialog-backdrop city-management-backdrop" {...backdrop}>
        <div className="eco-dashboard social-window" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="social-heading">
            <header className="eco-header">
                <img src={`${import.meta.env.BASE_URL}assets/icons/social-network.png`} alt=""/>
                <h2 id="social-heading">{t('social.title')}</h2>
                <CloseButton onClick={toggle}/>
            </header>
            {account?.email ? <>
                <SocialTabs tab={tab} friendsPending={friendsPending} groupsPending={groupsPending} exchangesPending={exchangesPending} onSelect={setTab}/>
                <div id="social-panel" role="tabpanel" aria-labelledby={`social-tab-${tab}`}>
                    {tab === 'friends' ? <FriendsTab/> : tab === 'groups' ? <GroupsTab/> : tab === 'hall' ? <HallOfFameTab/> : tab === 'profile' ? <ProfileTab/> : <ExchangesTab/>}
                </div>
            </> : account ? <><SignInPrompt onSignIn={() => openSettings(true)}/><HallOfFameTab/></> : <p>{t('friends.connecting')}</p>}
        </div>
    </div>;
}
