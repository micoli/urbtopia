import { ReactNode } from 'react';

interface AccordionSectionProps {
    id: string;
    title: string;
    expanded: boolean;
    onToggle: () => void;
    chevron?: boolean;
    lockWhenExpanded?: boolean;
    guided?: boolean;
    className?: string;
    toggleClassName?: string;
    contentClassName?: string;
    headerAction?: ReactNode;
    children: ReactNode;
}

export function AccordionSection({ id, title, expanded, onToggle, chevron = false, lockWhenExpanded = false, guided, className, toggleClassName, contentClassName, headerAction, children }: AccordionSectionProps) {
    const toggleId = `${id}-toggle`;
    return (
        <section className={className} aria-label={title}>
            <h3 className={headerAction ? 'accordion-heading-with-action' : undefined}>
                <button type="button" className={toggleClassName} id={toggleId} aria-expanded={expanded} aria-disabled={lockWhenExpanded && expanded ? true : undefined} aria-controls={id} data-guided={guided} onClick={onToggle}>
                    <span>{title}</span>
                    {chevron && <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>}
                </button>
                {headerAction}
            </h3>
            <div className={contentClassName} id={id} aria-labelledby={toggleId} hidden={!expanded}>
                {children}
            </div>
        </section>
    );
}
