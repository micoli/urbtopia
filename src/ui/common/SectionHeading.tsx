import { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './iconRegistry';

interface SectionHeadingProps {
    icon?: IconName;
    children: ReactNode;
}

export function SectionHeading({ icon, children }: SectionHeadingProps) {
    return (
        <h3>
            {icon && <><Icon name={icon} />{' '}</>}
            {children}
        </h3>
    );
}
