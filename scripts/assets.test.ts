import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { MODEL_KEYS } from '../src/scene/renderItems';
import { ARCHIVES_DIR, ASSET_PACKS, QUATERNIUS_PACKS } from './assetPacks';
import { extractPack } from './extractPack';
import { managedModelKeys } from './managedModels';

const bytes = (text: string) => new TextEncoder().encode(text);

describe('asset packs', () => {
  it('provide every 3D model the scene can ask for', () => {
    const provided = new Set([...ASSET_PACKS, ...QUATERNIUS_PACKS].flatMap((pack) => pack.files.map((file) => `${pack.name}/${file}`)));
    const managed = new Set(managedModelKeys());
    const missing = MODEL_KEYS.filter((key) => !provided.has(key) && !managed.has(key));
    expect(missing).toEqual([]);
  });

  it('keep a hand-made model only when the scene uses it', () => {
    const used = new Set(MODEL_KEYS);
    expect(managedModelKeys().filter((key) => !used.has(key))).toEqual([]);
  });

  it('download nothing the scene does not use', () => {
    const used = new Set(MODEL_KEYS);
    const unused = [...ASSET_PACKS, ...QUATERNIUS_PACKS].flatMap((pack) => pack.files.map((file) => `${pack.name}/${file}`)).filter((key) => !used.has(key));
    expect(unused).toEqual([]);
  });

  it('point to Kenney downloads', () => {
    for (const pack of ASSET_PACKS) expect(pack.url).toMatch(/^https:\/\/kenney\.nl\/media\/.+\.zip$/);
  });
});

describe('versioned archives', () => {
  it('are named like the Kenney download they come from', () => {
    for (const pack of ASSET_PACKS) expect(pack.url.endsWith(`/${pack.archive}`), pack.name).toBe(true);
  });

  it.each(ASSET_PACKS)('contain every model wanted from the $name pack, so installing needs no network', (pack) => {
    const path = join(ARCHIVES_DIR, pack.archive);
    expect(existsSync(path), path).toBe(true);
    const files = extractPack(new Uint8Array(readFileSync(path)), pack.files, pack.colormap);
    if (pack.colormap !== false) expect(files.map((file) => file.path)).toContain('Textures/colormap.png');
    expect(files.filter((file) => file.path.endsWith('.glb'))).toHaveLength(pack.files.length);
  });
});

describe('extractPack', () => {
  const archive = zipSync({
    'Models/GLB format/building-a.glb': bytes('a'),
    'Models/GLB format/building-b.glb': bytes('b'),
    'Models/GLB format/building-z.glb': bytes('z'),
    'Models/GLB format/Textures/colormap.png': bytes('glb-texture'),
    'Models/FBX format/Textures/colormap.png': bytes('fbx-texture'),
    'Models/FBX format/building-a.fbx': bytes('fbx'),
    'License.txt': bytes('CC0'),
  });

  it('keeps only the wanted models and the colour map, flattened next to each other', () => {
    const files = extractPack(archive, ['building-a', 'building-b']);
    expect(files.map((file) => file.path).sort()).toEqual(['Textures/colormap.png', 'building-a.glb', 'building-b.glb']);
    expect(new TextDecoder().decode(files.find((file) => file.path === 'Textures/colormap.png')?.data)).toBe('glb-texture');
  });

  it('falls back on the FBX colour map when the GLB folder has none', () => {
    const noGlbTexture = zipSync({
      'Models/GLB format/building-a.glb': bytes('a'),
      'Models/FBX format/Textures/colormap.png': bytes('fbx-texture'),
    });
    const files = extractPack(noGlbTexture, ['building-a']);
    expect(new TextDecoder().decode(files.find((file) => file.path === 'Textures/colormap.png')?.data)).toBe('fbx-texture');
  });

  it('fails clearly when a wanted model is missing or there is no colour map', () => {
    expect(() => extractPack(archive, ['building-a', 'building-q'])).toThrow('building-q');
    expect(() => extractPack(zipSync({ 'Models/GLB format/building-a.glb': bytes('a') }), ['building-a'])).toThrow('colormap');
  });

  it('extracts models without an external colour map when the pack does not require one', () => {
    const archive = zipSync({ 'Models/GLTF format/tree.glb': bytes('tree') });
    expect(extractPack(archive, 'all', false).map((file) => file.path)).toEqual(['tree.glb']);
    expect(() => extractPack(archive, ['missing'], false)).toThrow('missing.glb');
  });
});
