import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARCHIVES_DIR, ASSET_PACKS } from './assetPacks.ts';
import { extractPack } from './extractPack.ts';

async function download(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

try {
  mkdirSync(ARCHIVES_DIR, { recursive: true });
  for (const pack of ASSET_PACKS) {
    console.log(`↓ ${pack.archive}`);
    const archive = await download(pack.url);
    extractPack(archive, pack.files);
    writeFileSync(join(ARCHIVES_DIR, pack.archive), archive);
  }
  console.log('Archives refreshed in assets/kenney. Run `npm run assets -- --force` to extract them, then commit.');
  console.log('Assets by Kenney (https://kenney.nl), CC0.');
} catch (error) {
  console.error(`\nDownload failed: ${error instanceof Error ? error.message : error}`);
  console.error('The Kenney zip links contain a hash that changes with new releases: update scripts/assetPacks.ts from the pack page on https://kenney.nl/assets.');
  process.exit(1);
}
