import { BUILD_SECTION_TITLES } from '../../core/buildings/buildSections';
import { BUILDING_SECTIONS, type BuildSection } from '../../codex/buildingSections';
export { BUILDING_SECTIONS, type BuildSection } from '../../codex/buildingSections';
export const BUILD_SECTION_KEY = 'urbtopia-build-section';
const ALL_CLOSED = 'none';

export function readBuildSection(): BuildSection | null {
  try {
    const stored = localStorage.getItem(BUILD_SECTION_KEY);
    if (stored === ALL_CLOSED) return null;
    const section = BUILDING_SECTIONS.find(section => section.title === stored);
    return section?.title ?? BUILD_SECTION_TITLES[0];
  } catch {
    return BUILD_SECTION_TITLES[0];
  }
}

export function writeBuildSection(section: BuildSection | null): void {
  try {
    localStorage.setItem(BUILD_SECTION_KEY, section ?? ALL_CLOSED);
  } catch {
    return;
  }
}
