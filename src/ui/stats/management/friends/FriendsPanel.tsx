import { t } from '../../../../i18n/t';
import type { EmailCodeActions, EmailCodeState } from '../../../../store/cloudStore';
import type { ActionFailure, HandleFormState, SearchState, SocialActions, SocialStatus } from '../../../../store/socialStore';
import type { CloudAccount } from '../../../../persistence/cloud/types';
import type { SocialState } from '../../../../social/types';
import { Note } from '../../../common/Note';
import { EmailCodeForm } from '../../../system/EmailCodeForm';
import { BlockedList } from './BlockedList';
import { FindableToggle } from './FindableToggle';
import { FriendList } from './FriendList';
import { FriendSearchForm } from './FriendSearchForm';
import { HandleForm } from './HandleForm';
import { IncomingRequests } from './IncomingRequests';
import { OutgoingRequests } from './OutgoingRequests';
import { friendsErrorMessage } from './friendsErrorMessage';

interface FriendsPanelProps {
    account: CloudAccount | null;
    emailCode: EmailCodeState;
    status: SocialStatus;
    profile: SocialState | null;
    handleForm: HandleFormState;
    search: SearchState;
    actionFailure: ActionFailure | null;
    now: number;
    changeDelayMs: number;
    codeActions: EmailCodeActions;
    actions: Pick<SocialActions, 'setHandle' | 'setFindable' | 'sendRequest' | 'accept' | 'refuse' | 'remove' | 'block' | 'unblock'>;
}

export function FriendsPanel({account, emailCode, status, profile, handleForm, search, actionFailure, now, changeDelayMs, codeActions, actions}: FriendsPanelProps) {
    if (!account) return <p>{t('friends.connecting')}</p>;
    if (!account.email) return <>
        <p>{t('friends.needEmail')}</p>
        <EmailCodeForm state={emailCode} actions={codeActions}/>
    </>;
    if (status === 'offline') return <Note>{t('friends.offline')}</Note>;
    if (status === 'no-handle') return <HandleForm current={null} changeWaitSeconds={0} state={handleForm} onSubmit={handle => void actions.setHandle(handle)}/>;
    if (!profile) return <p>{t('friends.connecting')}</p>;
    const waitSeconds = Math.ceil((profile.handleChangedAt + changeDelayMs - now) / 1000);
    return <>
        <FriendSearchForm state={search} onSend={email => void actions.sendRequest(email)}/>
        {actionFailure ? <Note>{friendsErrorMessage(actionFailure.error, actionFailure.retryAfterSeconds)}</Note> : null}
        <IncomingRequests requests={profile.incoming} onAccept={id => void actions.accept(id)} onRefuse={id => void actions.refuse(id)} onBlock={id => void actions.block(id)}/>
        <FriendList friends={profile.friends} onRemove={id => void actions.remove(id)} onBlock={id => void actions.block(id)}/>
        <OutgoingRequests requests={profile.outgoing} onCancel={id => void actions.refuse(id)}/>
        <BlockedList blocked={profile.blocked} onUnblock={id => void actions.unblock(id)}/>
        <p>{t('friends.handle.current')}: <strong>{profile.handle}</strong></p>
        <HandleForm key={profile.handle} current={profile.handle} changeWaitSeconds={waitSeconds} state={handleForm} onSubmit={handle => void actions.setHandle(handle)}/>
        <FindableToggle findable={profile.findable} onChange={findable => void actions.setFindable(findable)}/>
    </>;
}
