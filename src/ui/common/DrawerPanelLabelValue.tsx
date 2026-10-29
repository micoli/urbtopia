import { JSX, ReactNode } from 'react';
import { cn } from './cn';

interface DrawerPanelLabelValueProps {
    label: string;
    value?: string | number | JSX.Element;
    tone?: 'warn';
    children?: ReactNode;
}

export function DrawerPanelLabelValue({ label, value, tone, children }: DrawerPanelLabelValueProps) {
    return (
        <div className={cn('my-[1em]', tone && `note note--${tone}`)}>
            <strong>{label}</strong>: {value}{children ? <> {children}</> : null}
        </div>
    );
}
