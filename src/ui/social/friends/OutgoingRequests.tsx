import { t } from '../../../i18n/t';
import type { FriendRequest } from '../../../social/types';
import { ActionButton } from '../../common/ActionButton';

interface OutgoingRequestsProps {
    requests: FriendRequest[];
    onCancel: (userId: string) => void;
}

export function OutgoingRequests({requests, onCancel}: OutgoingRequestsProps) {
    if (requests.length === 0) return null;
    return <div className="friends-list">
        <h4>{t('friends.outgoing')}</h4>
        <ul>
            {requests.map(request => <li key={request.userId} className="friends-row">
                <strong>{request.handle}</strong>
                <ActionButton onClick={() => onCancel(request.userId)}>{t('friends.cancel')}</ActionButton>
            </li>)}
        </ul>
    </div>;
}
