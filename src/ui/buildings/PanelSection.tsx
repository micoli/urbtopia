import type { ReactNode } from 'react';
import { AccordionSection } from '../common/AccordionSection';
import type { IconName } from '../common/iconRegistry';
import type { PanelSectionId } from './panelSections';
import { usePanelSection } from './usePanelSection';

const ICON_BY_SECTION: Record<PanelSectionId, IconName> = { usage: 'production', modifications: 'repair', help: 'info' };

interface PanelSectionProps {
  id: PanelSectionId;
  title: string;
  children: ReactNode;
}

export function PanelSection({ id, title, children }: PanelSectionProps) {
  const [expanded, toggle] = usePanelSection(id);
  return (
    <AccordionSection id={`panel-section-${id}`} title={title} icon={ICON_BY_SECTION[id]} expanded={expanded} onToggle={toggle} chevron className="panel-section" toggleClassName="panel-section-toggle" contentClassName="panel-section-body">
      {children}
    </AccordionSection>
  );
}
