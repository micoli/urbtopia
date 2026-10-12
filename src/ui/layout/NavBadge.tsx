import { t } from '../../i18n/t';

interface NavBadgeProps {
    count?: number;
    label?: string;
}

export function NavBadge({count = 0, label}: NavBadgeProps) {
    if (count <= 0) return null;
    return <small className="nav-badge" role="status" aria-label={`${label ?? t('social.title')}: ${count}`}>{count > 9 ? '9+' : count}</small>;
}
