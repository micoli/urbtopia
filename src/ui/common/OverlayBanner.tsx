import { ReactNode } from 'react';

interface OverlayBannerProps {
    variant: 'banner' | 'reminder';
    message: string;
    role?: 'alert';
    className?: string;
    children: ReactNode;
}

export function OverlayBanner({ variant, message, role, className, children }: OverlayBannerProps) {
    const classes = [variant, className].filter(Boolean).join(' ');
    return (
        <div className={classes} role={role}>
            <span>{message}</span>
            {children}
        </div>
    );
}
