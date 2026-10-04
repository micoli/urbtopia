import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { MODEL_KEYS } from '../src/scene/renderItems';
import { QUATERNIUS_ARCHIVES_DIR, QUATERNIUS_PACKS } from './assetPacks';
import { convertQuaterniusPack, fitScale, plantScale, TILE_FILL } from './quaternius';

const archiveOf = (name: string) => new Uint8Array(readFileSync(join(QUATERNIUS_ARCHIVES_DIR, QUATERNIUS_PACKS.find((pack) => pack.name === name)!.archive)));

describe('Quaternius packs', () => {
  it('provide every crop and farm model the scene can ask for', () => {
    const provided = new Set(QUATERNIUS_PACKS.flatMap((pack) => pack.files.map((file) => `${pack.name}/${file}`)));
    const asked = MODEL_KEYS.filter((key) => key.startsWith('crops/') || key.startsWith('farm/'));
    expect(asked.filter((key) => !provided.has(key))).toEqual([]);
    expect([...provided].filter((key) => !MODEL_KEYS.includes(key))).toEqual([]);
  });

  it.each(QUATERNIUS_PACKS)('ship every wanted model of $name as FBX in the versioned archive', (pack) => {
    expect(existsSync(join(QUATERNIUS_ARCHIVES_DIR, pack.archive))).toBe(true);
    const names = Object.keys(unzipSync(archiveOf(pack.name))).map((path) => path.replace(/^FBX\//, '').replace(/\.fbx$/, ''));
    expect(pack.files.filter((file) => !names.includes(file))).toEqual([]);
  });

  it('lack exactly the models the spec lists as gaps', () => {
    const names = Object.keys(unzipSync(archiveOf('crops'))).map((path) => path.replace(/^FBX\//, '').replace(/\.fbx$/, ''));
    expect(names).not.toContain('Grass_Crop');
    for (const species of ['Bamboo', 'Beet', 'Carrot', 'Grass', 'Rice', 'Wheat']) expect(names).not.toContain(`${species}_Harvested`);
  });

  it('converts to binary glTF files', async () => {
    const files = await convertQuaterniusPack(archiveOf('farm'), QUATERNIUS_PACKS.find((pack) => pack.name === 'farm')!);
    expect(files.map((file) => file.path)).toEqual(['Barn.glb', 'OpenBarn.glb', 'Silo_House.glb', 'Silo.glb']);
    for (const file of files) expect(new TextDecoder().decode(file.data.slice(0, 4))).toBe('glTF');
  });
});

describe('model scale', () => {
  it('fits the widest growth stage into one tile, or the height limit when the plant is tall and thin', () => {
    expect(plantScale([{ width: 10, height: 20, depth: 10 }, { width: 100, height: 120, depth: 50 }])).toBeCloseTo(TILE_FILL / 100);
    expect(plantScale([{ width: 10, height: 400, depth: 10 }])).toBeCloseTo(1.6 / 400);
  });

  it('fits produce and buildings by their widest side', () => {
    expect(fitScale({ width: 50, height: 10, depth: 200 }, 0.4)).toBeCloseTo(0.002);
  });
});
