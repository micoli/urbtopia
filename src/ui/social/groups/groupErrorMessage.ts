import type { MessageKey } from '../../../i18n/messages';
import { t } from '../../../i18n/t';
import type { SocialErrorKind } from '../../../social/types';
import { friendsErrorMessage } from '../friends/friendsErrorMessage';

type GroupErrorKind = 'group-name-invalid' | 'group-name-forbidden' | 'group-full' | 'group-creator-cannot-leave' | 'cap-groups-created' | 'cap-groups-joined' | 'not-creator';

const GROUP_KINDS: ReadonlySet<SocialErrorKind> = new Set<GroupErrorKind>([
    'group-name-invalid', 'group-name-forbidden', 'group-full', 'group-creator-cannot-leave', 'cap-groups-created', 'cap-groups-joined', 'not-creator',
]);

export function groupErrorMessage(kind: SocialErrorKind, retryAfterSeconds: number | null): string {
    if (!GROUP_KINDS.has(kind)) return friendsErrorMessage(kind, retryAfterSeconds, 'message');
    return t(`groups.error.${kind as GroupErrorKind}` as MessageKey);
}
