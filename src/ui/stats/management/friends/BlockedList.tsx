import { t } from '../../../../i18n/t';
import type { BlockedPlayer } from '../../../../social/types';
import { ActionButton } from '../../../common/ActionButton';

interface BlockedListProps {
    blocked: BlockedPlayer[];
    onUnblock: (userId: string) => void;
}

export function BlockedList({blocked, onUnblock}: BlockedListProps) {
    if (blocked.length === 0) return null;
    return <div className="friends-list">
        <h4>{t('friends.blocked')}</h4>
        <ul>
            {blocked.map(player => <li key={player.userId} className="friends-row">
                <strong>{player.handle}</strong>
                <ActionButton onClick={() => onUnblock(player.userId)}>{t('friends.unblock')}</ActionButton>
            </li>)}
        </ul>
    </div>;
}
