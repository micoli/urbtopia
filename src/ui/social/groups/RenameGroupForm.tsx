import { useState } from 'react';
import { t } from '../../../i18n/t';
import { GROUP_NAME_MAX } from '../../../social/limits';
import { ActionButton } from '../../common/ActionButton';

interface RenameGroupFormProps {
    current: string;
    busy: boolean;
    onRename: (name: string) => void;
}

export function RenameGroupForm({current, busy, onRename}: RenameGroupFormProps) {
    const [name, setName] = useState(current);
    const changed = name.trim() !== '' && name.trim() !== current;
    return <form className="groups-form" onSubmit={event => {
        event.preventDefault();
        if (changed && !busy) onRename(name);
    }}>
        <label>
            {t('groups.name.label')}
            <input type="text" maxLength={GROUP_NAME_MAX} autoComplete="off" value={name} onChange={event => setName(event.target.value)}/>
        </label>
        <ActionButton type="submit" variant="primary" disabled={!changed || busy}>{t('groups.rename.save')}</ActionButton>
    </form>;
}
