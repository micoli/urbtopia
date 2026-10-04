import { JSX, ReactNode } from 'react';

interface DrawerPanelLabelValueProps {
    label: string;
    value?: string | number | JSX.Element;
    children?: ReactNode;
}

export function DrawerPanelLabelValue({ label, value, children }: DrawerPanelLabelValueProps) {
    return (
        <p>
            <strong>{label}</strong>: {value}{children}
        </p>
    );
}
