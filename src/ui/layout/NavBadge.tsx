import { t } from '../../i18n/t';
import { CountBadge } from '../common/CountBadge';

interface NavBadgeProps {
    count?: number;
    label?: string;
}

export function NavBadge({count = 0, label}: NavBadgeProps) {
    return <CountBadge floating role="status" count={count} label={label ?? t('social.title')}/>;
}
