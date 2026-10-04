import { ReactNode } from 'react';

interface SectionHeadingProps {
    icon?: string;
    children: ReactNode;
}

export function SectionHeading({ icon, children }: SectionHeadingProps) {
    return (
        <h3>
            {icon && <><span aria-hidden="true">{icon}</span>{' '}</>}
            {children}
        </h3>
    );
}
