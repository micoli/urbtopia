import { t } from '../../../i18n/t';
import type { Group } from '../../../social/types';

interface GroupRowProps {
    group: Group;
    onOpen: () => void;
}

export function GroupRow({group, onOpen}: GroupRowProps) {
    return <li className="groups-row">
        <button type="button" className="groups-row-open" onClick={onOpen}>
            <strong>{group.name}</strong>
            <small>{t('groups.members').replace('{N}', String(group.members.length))}</small>
            {group.lastMessagePreview ? <span className="groups-row-preview">{t('groups.lastMessage').replace('{H}', group.lastMessageFrom ?? '').replace('{M}', group.lastMessagePreview)}</span> : null}
            {group.unread > 0 ? <small className="friends-unread" aria-label={`${t('friends.unread')}: ${group.unread}`}>{group.unread}</small> : null}
        </button>
    </li>;
}
