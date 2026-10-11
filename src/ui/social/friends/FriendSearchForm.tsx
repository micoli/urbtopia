import { useState } from 'react';
import { t } from '../../../i18n/t';
import type { SearchState } from '../../../store/socialStore';
import { ActionButton } from '../../common/ActionButton';
import { Note } from '../../common/Note';
import { friendsErrorMessage } from './friendsErrorMessage';

interface FriendSearchFormProps {
    state: SearchState;
    onSend: (email: string) => void;
}

export function FriendSearchForm({state, onSend}: FriendSearchFormProps) {
    const [email, setEmail] = useState('');
    const sending = state.kind === 'sending';
    return <form className="friends-search" onSubmit={event => {
        event.preventDefault();
        onSend(email);
    }}>
        <h4>{t('friends.search.title')}</h4>
        <input type="email" autoComplete="off" aria-label={t('friends.search.label')} placeholder={t('friends.search.label')} value={email} onChange={event => setEmail(event.target.value)}/>
        <ActionButton type="submit" variant="primary" disabled={sending}>
            {sending ? t('friends.search.sending') : t('friends.search.send')}
        </ActionButton>
        {state.kind === 'sent' ? <Note tone="muted">{t('friends.search.sent')}</Note> : null}
        {state.kind === 'invalid-email' ? <Note>{t('friends.search.invalidEmail')}</Note> : null}
        {state.kind === 'error' ? <Note>{friendsErrorMessage(state.error, state.retryAfterSeconds)}</Note> : null}
    </form>;
}
