import { t } from '../../../../i18n/t';
import type { FriendRequest } from '../../../../social/types';
import { ActionButton } from '../../../common/ActionButton';

interface IncomingRequestsProps {
    requests: FriendRequest[];
    onAccept: (userId: string) => void;
    onRefuse: (userId: string) => void;
    onBlock: (userId: string) => void;
}

export function IncomingRequests({requests, onAccept, onRefuse, onBlock}: IncomingRequestsProps) {
    if (requests.length === 0) return null;
    return <div className="friends-list">
        <h4>{t('friends.incoming')}</h4>
        <ul>
            {requests.map(request => <li key={request.userId} className="friends-row">
                <strong>{request.handle}</strong>
                <ActionButton variant="primary" onClick={() => onAccept(request.userId)}>{t('friends.accept')}</ActionButton>
                <ActionButton onClick={() => onRefuse(request.userId)}>{t('friends.refuse')}</ActionButton>
                <ActionButton onClick={() => onBlock(request.userId)}>{t('friends.block')}</ActionButton>
            </li>)}
        </ul>
    </div>;
}
