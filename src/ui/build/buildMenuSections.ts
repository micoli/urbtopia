import { BUILDING_SECTIONS, type BuildSection } from '../../codex/buildingSections';
export { BUILDING_SECTIONS, type BuildSection } from '../../codex/buildingSections';
export const BUILD_SECTION_KEY = 'urbtopia-build-section';

export function readBuildSection(): BuildSection {
  try {
    const stored = localStorage.getItem(BUILD_SECTION_KEY);
    const section = BUILDING_SECTIONS.find(section => section.title === stored);
    return section?.title ?? BUILDING_SECTIONS[0].title;
  } catch {
    return BUILDING_SECTIONS[0].title;
  }
}

export function writeBuildSection(section: BuildSection): void {
  try {
    localStorage.setItem(BUILD_SECTION_KEY, section);
  } catch {
    return;
  }
}
