import { useState } from 'react';
import { t } from '../../../i18n/t';
import type { Friend } from '../../../social/types';
import { ActionButton } from '../../common/ActionButton';
import { FriendPicker } from './FriendPicker';

interface AddMembersFormProps {
    candidates: Friend[];
    busy: boolean;
    onAdd: (memberIds: string[]) => void;
}

export function AddMembersForm({candidates, busy, onAdd}: AddMembersFormProps) {
    const [chosen, setChosen] = useState<string[]>([]);
    return <form className="groups-form" onSubmit={event => {
        event.preventDefault();
        if (chosen.length > 0 && !busy) onAdd(chosen);
    }}>
        <FriendPicker friends={candidates} chosen={chosen} onToggle={userId => setChosen(current => current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId])}/>
        <ActionButton type="submit" variant="primary" disabled={chosen.length === 0 || busy}>{t('groups.add.save')}</ActionButton>
    </form>;
}
