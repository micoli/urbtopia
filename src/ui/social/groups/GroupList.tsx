import { t } from '../../../i18n/t';
import type { Group } from '../../../social/types';
import { ActionButton } from '../../common/ActionButton';
import { GroupRow } from './GroupRow';

interface GroupListProps {
    groups: Group[];
    hasFriends: boolean;
    onOpen: (groupId: string) => void;
    onNew: () => void;
}

export function GroupList({groups, hasFriends, onOpen, onNew}: GroupListProps) {
    return <div className="groups-list">
        <ActionButton variant="primary" disabled={!hasFriends} onClick={onNew}>{t('groups.new')}</ActionButton>
        {groups.length === 0 ? <p className="note note--muted">{t(hasFriends ? 'groups.empty' : 'groups.emptyNoFriends')}</p> : <ul>
            {groups.map(group => <GroupRow key={group.id} group={group} onOpen={() => onOpen(group.id)}/>)}
        </ul>}
    </div>;
}
