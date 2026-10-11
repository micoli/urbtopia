import { useState } from 'react';
import { t } from '../../../i18n/t';
import type { HandleFormState } from '../../../store/socialStore';
import { ActionButton } from '../../common/ActionButton';
import { Note } from '../../common/Note';
import { daysFromSeconds, friendsErrorMessage } from './friendsErrorMessage';

interface HandleFormProps {
    current: string | null;
    changeWaitSeconds: number;
    state: HandleFormState;
    onSubmit: (handle: string) => void;
}

export function HandleForm({current, changeWaitSeconds, state, onSubmit}: HandleFormProps) {
    const [handle, setHandle] = useState(current ?? '');
    const saving = state.kind === 'saving';
    const waiting = current !== null && changeWaitSeconds > 0;
    return <form className="friends-handle" onSubmit={event => {
        event.preventDefault();
        onSubmit(handle);
    }}>
        {current === null ? <p>{t('friends.chooseHandle')}</p> : null}
        <label>
            {t('friends.handle.label')}
            <input type="text" autoComplete="nickname" maxLength={20} placeholder={t('friends.handle.label')} value={handle} disabled={waiting} onChange={event => setHandle(event.target.value)}/>
        </label>
        <Note tone="muted">{t('friends.handle.hint')}</Note>
        {waiting ? <Note tone="muted">{t('friends.handle.changeLater').replace('{N}', String(daysFromSeconds(changeWaitSeconds)))}</Note> : null}
        <ActionButton type="submit" variant="primary" disabled={saving || waiting}>
            {saving ? t('friends.handle.saving') : t(current === null ? 'friends.handle.choose' : 'friends.handle.change')}
        </ActionButton>
        {state.kind === 'error' ? <Note>{friendsErrorMessage(state.error, state.retryAfterSeconds)}</Note> : null}
    </form>;
}
