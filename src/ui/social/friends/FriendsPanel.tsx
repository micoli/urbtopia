import { t } from '../../../i18n/t';
import type { ActionFailure, ConversationState, SearchState, SocialActions, SocialStatus } from '../../../store/socialStore';
import type { SocialState } from '../../../social/types';
import { ActionButton } from '../../common/ActionButton';
import { Note } from '../../common/Note';
import { ConversationView } from './ConversationView';
import { FriendList } from './FriendList';
import { FriendSearchForm } from './FriendSearchForm';
import { IncomingRequests } from './IncomingRequests';
import { OutgoingRequests } from './OutgoingRequests';
import { friendsErrorMessage } from './friendsErrorMessage';

interface FriendsPanelProps {
    status: SocialStatus;
    profile: SocialState | null;
    search: SearchState;
    actionFailure: ActionFailure | null;
    conversation: ConversationState | null;
    onOpenProfile: () => void;
    onTrade: (userId: string) => void;
    actions: Pick<SocialActions, 'sendRequest' | 'accept' | 'refuse' | 'remove' | 'block' | 'openConversation' | 'closeConversation' | 'sendMessage' | 'refreshConversation'>;
}

export function FriendsPanel({status, profile, search, actionFailure, conversation, onOpenProfile, onTrade, actions}: FriendsPanelProps) {
    if (status === 'offline') return <Note>{t('friends.offline')}</Note>;
    if (status === 'no-handle') return <>
        <p>{t('friends.needHandle')}</p>
        <ActionButton variant="primary" onClick={onOpenProfile}>{t('friends.goToProfile')}</ActionButton>
    </>;
    if (!profile) return <p>{t('friends.connecting')}</p>;
    if (conversation) return <ConversationView conversation={conversation} avatar={profile.friends.find(friend => friend.userId === conversation.userId)?.avatar ?? null} onBack={() => void actions.closeConversation()} onSend={body => void actions.sendMessage(body)} onRefresh={() => actions.refreshConversation()}/>;
    return <>
        <FriendSearchForm state={search} onSend={email => void actions.sendRequest(email)}/>
        {actionFailure ? <Note>{friendsErrorMessage(actionFailure.error, actionFailure.retryAfterSeconds)}</Note> : null}
        <IncomingRequests requests={profile.incoming} onAccept={id => void actions.accept(id)} onRefuse={id => void actions.refuse(id)} onBlock={id => void actions.block(id)}/>
        <FriendList friends={profile.friends} onMessage={friend => void actions.openConversation(friend.userId, friend.handle)} onTrade={friend => onTrade(friend.userId)} onRemove={id => void actions.remove(id)} onBlock={id => void actions.block(id)}/>
        <OutgoingRequests requests={profile.outgoing} onCancel={id => void actions.refuse(id)}/>
    </>;
}
