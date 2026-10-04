import { HTMLAttributes, ReactNode } from 'react';

interface LabeledListRowProps extends HTMLAttributes<HTMLDivElement> {
    label: ReactNode;
}

export function LabeledListRow({ label, children, ...rest }: LabeledListRowProps) {
    return (
        <div {...rest}>
            <dt>{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}
