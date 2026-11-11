import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const RELEASE_NAME_PLACEHOLDER = '__URBTOPIA_RELEASE_NAME__';

const STAMPED_FILE = /\.(js|html)$/;

export function stampReleaseName(directory: string, releaseName: string): number {
  const files = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && STAMPED_FILE.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
  let stamped = 0;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    if (!content.includes(RELEASE_NAME_PLACEHOLDER)) continue;
    writeFileSync(file, content.replaceAll(RELEASE_NAME_PLACEHOLDER, releaseName));
    stamped += 1;
  }
  return stamped;
}

if (process.argv[1]?.endsWith('stampReleaseName.ts')) {
  const [directory = 'dist', releaseName] = process.argv.slice(2);
  if (!releaseName) {
    console.error('Usage: node scripts/stampReleaseName.ts <directory> <release name>');
    process.exit(1);
  }
  const stamped = stampReleaseName(directory, releaseName);
  if (stamped === 0) {
    console.error(`${RELEASE_NAME_PLACEHOLDER} not found in ${directory}`);
    process.exit(1);
  }
  console.log(`Release name stamped in ${stamped} file(s)`);
}
