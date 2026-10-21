import { HTMLAttributes } from 'react';

interface CountBadgeProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    count: number;
    label?: string;
    floating?: boolean;
}

export function CountBadge({count, label, floating = false, className, ...rest}: CountBadgeProps) {
    if (count <= 0) return null;
    const classes = ['count-badge', floating && 'count-badge--floating', className].filter(Boolean).join(' ');
    return <small className={classes} aria-label={label && `${label}: ${count}`} {...rest}>{count > 9 ? '9+' : count}</small>;
}
