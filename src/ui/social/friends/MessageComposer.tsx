import { useState } from 'react';
import { t } from '../../../i18n/t';
import { MAX_MESSAGE_LENGTH } from '../../../social/limits';
import { ActionButton } from '../../common/ActionButton';

interface MessageComposerProps {
    sending: boolean;
    onSend: (body: string) => void;
}

export function MessageComposer({sending, onSend}: MessageComposerProps) {
    const [body, setBody] = useState('');
    const empty = body.trim() === '';
    return <form className="friends-composer" onSubmit={event => {
        event.preventDefault();
        if (empty || sending) return;
        onSend(body);
        setBody('');
    }}>
        <input type="text" maxLength={MAX_MESSAGE_LENGTH} autoComplete="off" aria-label={t('friends.conversation.placeholder')} placeholder={t('friends.conversation.placeholder')} value={body} onChange={event => setBody(event.target.value)}/>
        <ActionButton type="submit" variant="primary" disabled={empty || sending}>{sending ? t('friends.conversation.sending') : t('friends.conversation.send')}</ActionButton>
    </form>;
}
