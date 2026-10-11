import { t } from '../../../i18n/t';
import type { ConversationState } from '../../../store/socialStore';
import { ActionButton } from '../../common/ActionButton';
import { Note } from '../../common/Note';
import { HandleLabel } from '../HandleLabel';
import { friendsErrorMessage } from './friendsErrorMessage';
import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';

interface ConversationViewProps {
    conversation: ConversationState;
    avatar: string | null;
    onBack: () => void;
    onSend: (body: string) => void;
    onRefresh: () => Promise<void>;
}

export function ConversationView({conversation, avatar, onBack, onSend, onRefresh}: ConversationViewProps) {
    return <div className="friends-conversation">
        <div className="friends-conversation-header">
            <ActionButton onClick={onBack}>{t('friends.conversation.back')}</ActionButton>
            <h4><HandleLabel userId={conversation.userId} handle={conversation.handle} avatar={avatar}/></h4>
        </div>
        <MessageList messages={conversation.messages} loading={conversation.loading}/>
        {conversation.failure ? <Note>{friendsErrorMessage(conversation.failure.error, conversation.failure.retryAfterSeconds, 'message')}</Note> : null}
        <MessageComposer sending={conversation.sending} onSend={onSend} onRefresh={onRefresh}/>
    </div>;
}
