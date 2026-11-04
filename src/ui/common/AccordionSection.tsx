import { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './iconRegistry';

interface AccordionSectionProps {
    id: string;
    title: string;
    icon?: IconName;
    expanded: boolean;
    onToggle: () => void;
    chevron?: boolean;
    guided?: boolean;
    nested?: boolean;
    className?: string;
    toggleClassName?: string;
    contentClassName?: string;
    headerAction?: ReactNode;
    children: ReactNode;
}

export function AccordionSection({ id, title, icon, expanded, onToggle, chevron = false, guided, nested = false, className, toggleClassName, contentClassName, headerAction, children }: AccordionSectionProps) {
    const toggleId = `${id}-toggle`;
    const Wrapper = nested ? 'div' : 'section';
    const Heading = nested ? 'h4' : 'h3';
    return (
        <Wrapper className={className} role={nested ? 'group' : undefined} aria-label={title}>
            <Heading className={headerAction ? 'accordion-heading-with-action' : undefined}>
                <button type="button" className={toggleClassName} id={toggleId} aria-expanded={expanded} aria-controls={id} data-guided={guided} onClick={onToggle}>
                    {icon && <Icon name={icon} />}
                    <span>{title}</span>
                    {chevron && <Icon name={expanded ? 'chevronDown' : 'chevronRight'} />}
                </button>
                {headerAction}
            </Heading>
            <div className={contentClassName} id={id} aria-labelledby={toggleId} hidden={!expanded}>
                {children}
            </div>
        </Wrapper>
    );
}
