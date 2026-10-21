import { t } from '../../../i18n/t';
import type { Group } from '../../../social/types';
import { CountBadge } from '../../common/CountBadge';

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
            <CountBadge count={group.unread} label={t('friends.unread')}/>
        </button>
    </li>;
}
