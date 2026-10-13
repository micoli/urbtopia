import { useState } from 'react';
import { t } from '../../../i18n/t';
import { GROUP_NAME_MAX } from '../../../social/limits';
import type { Friend } from '../../../social/types';
import { ActionButton } from '../../common/ActionButton';
import { FriendPicker } from './FriendPicker';

interface NewGroupFormProps {
    friends: Friend[];
    busy: boolean;
    onCreate: (name: string, memberIds: string[]) => void;
    onCancel: () => void;
}

export function NewGroupForm({friends, busy, onCreate, onCancel}: NewGroupFormProps) {
    const [name, setName] = useState('');
    const [chosen, setChosen] = useState<string[]>([]);
    const ready = name.trim() !== '' && chosen.length > 0;
    return <form className="groups-form" onSubmit={event => {
        event.preventDefault();
        if (ready && !busy) onCreate(name, chosen);
    }}>
        <label>
            {t('groups.name.label')}
            <input type="text" maxLength={GROUP_NAME_MAX} autoComplete="off" value={name} onChange={event => setName(event.target.value)}/>
        </label>
        <FriendPicker friends={friends} chosen={chosen} onToggle={userId => setChosen(current => current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId])}/>
        <ActionButton onClick={onCancel}>{t('groups.cancel')}</ActionButton>
        <ActionButton type="submit" variant="primary" disabled={!ready || busy}>{busy ? t('groups.creating') : t('groups.create')}</ActionButton>
    </form>;
}
