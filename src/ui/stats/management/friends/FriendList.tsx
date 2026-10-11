import { t } from '../../../../i18n/t';
import type { Friend } from '../../../../social/types';
import { FriendRow } from './FriendRow';

interface FriendListProps {
    friends: Friend[];
    onRemove: (userId: string) => void;
    onBlock: (userId: string) => void;
}

export function FriendList({friends, onRemove, onBlock}: FriendListProps) {
    return <div className="friends-list">
        <h4>{t('friends.list')}</h4>
        {friends.length === 0 ? <p className="note note--muted">{t('friends.none')}</p> : <ul>
            {friends.map(friend => <FriendRow key={friend.userId} handle={friend.handle} onRemove={() => onRemove(friend.userId)} onBlock={() => onBlock(friend.userId)}/>)}
        </ul>}
    </div>;
}
