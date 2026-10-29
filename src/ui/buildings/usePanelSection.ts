import { useState } from 'react';
import { readPanelSections, writePanelSection, type PanelSectionId } from './panelSections';

export function usePanelSection(id: PanelSectionId): [boolean, () => void] {
  const [expanded, setExpanded] = useState(() => readPanelSections()[id]);
  const toggle = () => {
    writePanelSection(id, !expanded);
    setExpanded(!expanded);
  };
  return [expanded, toggle];
}
