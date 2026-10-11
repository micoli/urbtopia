import { t } from '../../../i18n/t';
import type { EmailCodeActions, EmailCodeState } from '../../../store/cloudStore';
import type { ActionFailure, ConversationState, HandleFormState, SearchState, SocialActions, SocialStatus } from '../../../store/socialStore';
import type { CloudAccount } from '../../../persistence/cloud/types';
import type { SocialState } from '../../../social/types';
import { Note } from '../../common/Note';
import { HandleLabel } from '../HandleLabel';
import { EmailCodeForm } from '../../system/EmailCodeForm';
import { AvatarPicker } from './AvatarPicker';
import { ConversationView } from './ConversationView';
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
    conversation: ConversationState | null;
    now: number;
    changeDelayMs: number;
    codeActions: EmailCodeActions;
    onTrade: (userId: string) => void;
    actions: Pick<SocialActions, 'setHandle' | 'setAvatar' | 'setFindable' | 'sendRequest' | 'accept' | 'refuse' | 'remove' | 'block' | 'unblock' | 'openConversation' | 'closeConversation' | 'sendMessage' | 'refreshConversation'>;
}

export function FriendsPanel({account, emailCode, status, profile, handleForm, search, actionFailure, conversation, now, changeDelayMs, codeActions, onTrade, actions}: FriendsPanelProps) {
    if (!account) return <p>{t('friends.connecting')}</p>;
    if (!account.email) return <>
        <p>{t('friends.needEmail')}</p>
        <EmailCodeForm state={emailCode} actions={codeActions}/>
    </>;
    if (status === 'offline') return <Note>{t('friends.offline')}</Note>;
    if (status === 'no-handle') return <HandleForm current={null} changeWaitSeconds={0} state={handleForm} onSubmit={handle => void actions.setHandle(handle)}/>;
    if (!profile) return <p>{t('friends.connecting')}</p>;
    if (conversation) return <ConversationView conversation={conversation} avatar={profile.friends.find(friend => friend.userId === conversation.userId)?.avatar ?? null} onBack={() => void actions.closeConversation()} onSend={body => void actions.sendMessage(body)} onRefresh={() => actions.refreshConversation()}/>;
    const waitSeconds = Math.ceil((profile.handleChangedAt + changeDelayMs - now) / 1000);
    return <>
        <FriendSearchForm state={search} onSend={email => void actions.sendRequest(email)}/>
        {actionFailure ? <Note>{friendsErrorMessage(actionFailure.error, actionFailure.retryAfterSeconds)}</Note> : null}
        <IncomingRequests requests={profile.incoming} onAccept={id => void actions.accept(id)} onRefuse={id => void actions.refuse(id)} onBlock={id => void actions.block(id)}/>
        <FriendList friends={profile.friends} onMessage={friend => void actions.openConversation(friend.userId, friend.handle)} onTrade={friend => onTrade(friend.userId)} onRemove={id => void actions.remove(id)} onBlock={id => void actions.block(id)}/>
        <OutgoingRequests requests={profile.outgoing} onCancel={id => void actions.refuse(id)}/>
        <BlockedList blocked={profile.blocked} onUnblock={id => void actions.unblock(id)}/>
        <p>{t('friends.handle.current')}: <HandleLabel userId={account.userId} handle={profile.handle} avatar={profile.avatar}/></p>
        <AvatarPicker userId={account.userId} chosen={profile.avatar} onChoose={avatar => void actions.setAvatar(avatar)}/>
        <HandleForm key={profile.handle} current={profile.handle} changeWaitSeconds={waitSeconds} state={handleForm} onSubmit={handle => void actions.setHandle(handle)}/>
        <FindableToggle findable={profile.findable} onChange={findable => void actions.setFindable(findable)}/>
    </>;
}
