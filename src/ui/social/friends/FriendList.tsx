import { t } from '../../../i18n/t';
import type { Friend } from '../../../social/types';
import { FriendRow } from './FriendRow';

interface FriendListProps {
    friends: Friend[];
    onMessage: (friend: Friend) => void;
    onTrade: (friend: Friend) => void;
    onRemove: (userId: string) => void;
    onBlock: (userId: string) => void;
}

export function FriendList({friends, onMessage, onTrade, onRemove, onBlock}: FriendListProps) {
    return <div className="friends-list">
        <h4>{t('friends.list')}</h4>
        {friends.length === 0 ? <p className="note note--muted">{t('friends.none')}</p> : <ul>
            {friends.map(friend => <FriendRow key={friend.userId} userId={friend.userId} handle={friend.handle} avatar={friend.avatar} unread={friend.unread} medals={friend.medals} onMessage={() => onMessage(friend)} onTrade={() => onTrade(friend)} onRemove={() => onRemove(friend.userId)} onBlock={() => onBlock(friend.userId)}/>)}
        </ul>}
    </div>;
}
