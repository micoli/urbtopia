import type { ReactNode } from 'react';
import { AccordionSection } from '../common/AccordionSection';
import type { PanelSectionId } from './panelSections';
import { usePanelSection } from './usePanelSection';

interface PanelSectionProps {
  id: PanelSectionId;
  title: string;
  children: ReactNode;
}

export function PanelSection({ id, title, children }: PanelSectionProps) {
  const [expanded, toggle] = usePanelSection(id);
  return (
    <AccordionSection id={`panel-section-${id}`} title={title} expanded={expanded} onToggle={toggle} chevron className="panel-section" toggleClassName="panel-section-toggle" contentClassName="panel-section-body">
      {children}
    </AccordionSection>
  );
}
