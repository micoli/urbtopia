import { JSX, ReactNode } from 'react';

interface DrawerPanelLabelValueProps {
    label: string;
    value?: string | number | JSX.Element;
    tone?: 'warn';
    children?: ReactNode;
}

export function DrawerPanelLabelValue({ label, value, tone, children }: DrawerPanelLabelValueProps) {
    return (
        <p className={tone && `note note--${tone}`}>
            <strong>{label}</strong>: {value}{children}
        </p>
    );
}
