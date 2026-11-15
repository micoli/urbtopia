import { HTMLAttributes, ReactNode } from 'react';

interface LabeledListRowProps extends HTMLAttributes<HTMLDivElement> {
    label: ReactNode;
}

export function LabeledListRow({ label, children, ...rest }: LabeledListRowProps) {
    return (
        <div {...rest}>
            <b>{label}</b>: {children}
        </div>
    );
}
