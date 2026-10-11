import { t } from '../../../i18n/t';
import type { FriendRequest } from '../../../social/types';
import { ActionButton } from '../../common/ActionButton';
import { HandleLabel } from '../HandleLabel';

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
                <HandleLabel userId={request.userId} handle={request.handle} avatar={request.avatar}/>
                <ActionButton onClick={() => onCancel(request.userId)}>{t('friends.cancel')}</ActionButton>
            </li>)}
        </ul>
    </div>;
}
