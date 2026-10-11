import { t } from '../../i18n/t';

interface NavBadgeProps {
    count?: number;
}

export function NavBadge({count = 0}: NavBadgeProps) {
    if (count <= 0) return null;
    return <small className="nav-badge" role="status" aria-label={`${t('friends.title')}: ${count}`}>{count > 9 ? '9+' : count}</small>;
}
