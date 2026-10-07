import { BUILD_SECTION_TITLES } from '../../core/buildings/buildSections';
import { BUILDING_SECTIONS, type BuildSection } from '../../codex/buildingSections';
export { BUILDING_SECTIONS, type BuildSection } from '../../codex/buildingSections';
export const BUILD_SECTION_KEY = 'urbtopia-build-section';

export function readBuildSection(): BuildSection {
  try {
    const stored = localStorage.getItem(BUILD_SECTION_KEY);
    const section = BUILDING_SECTIONS.find(section => section.title === stored);
    return section?.title ?? BUILD_SECTION_TITLES[0];
  } catch {
    return BUILD_SECTION_TITLES[0];
  }
}

export function writeBuildSection(section: BuildSection): void {
  try {
    localStorage.setItem(BUILD_SECTION_KEY, section);
  } catch {
    return;
  }
}
