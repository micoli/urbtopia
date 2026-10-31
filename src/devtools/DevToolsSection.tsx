import { useState, type ReactNode } from 'react';
import { AccordionSection } from '../ui/common/AccordionSection';
import type { IconName } from '../ui/common/iconRegistry';
import { readDevToolsSection, writeDevToolsSection, type DevToolsSectionId } from './devToolsStorage';

interface DevToolsSectionProps {
  id: DevToolsSectionId;
  title: string;
  icon: IconName;
  children: ReactNode;
}

export function DevToolsSection({ id, title, icon, children }: DevToolsSectionProps) {
  const [expanded, setExpanded] = useState(() => readDevToolsSection(id));
  const toggle = () => {
    writeDevToolsSection(id, !expanded);
    setExpanded(!expanded);
  };
  return (
    <AccordionSection id={`devtools-section-${id}`} title={title} icon={icon} expanded={expanded} onToggle={toggle} chevron className="panel-section" toggleClassName="panel-section-toggle" contentClassName="panel-section-body devtools-section-body">
      {children}
    </AccordionSection>
  );
}
