export const BUILD_SECTION_TITLES = [
  'build.housing',
  'build.production',
  'build.storage',
  'build.utilities',
  'build.transport',
  'build.water',
  'build.publicFacilities',
  'build.leisure',
  'build.sport',
  'build.decoration',
  'build.greenSpaces',
] as const;

export type BuildSection = typeof BUILD_SECTION_TITLES[number];
