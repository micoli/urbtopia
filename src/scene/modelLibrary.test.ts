import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { ModelLibrary } from './modelLibrary';

function libraryLoading(files: Record<string, 'ok' | 'fail'>) {
  const library = new ModelLibrary();
  const loader = (library as unknown as { loader: { loadAsync: (url: string) => Promise<unknown> } }).loader;
  loader.loadAsync = vi.fn(async (url: string) => {
    const key = Object.keys(files).find((name) => url.endsWith(`${name}.glb`))!;
    if (files[key] === 'fail') throw new Error(`cannot load ${key}`);
    return { scene: new THREE.Group(), animations: [] };
  });
  return library;
}

describe('loading progress', () => {
  it('reports every file asked for and every file that has arrived', async () => {
    const library = libraryLoading({ one: 'ok', two: 'ok' });
    const seen: [number, number][] = [];
    library.onProgress((finished, requested) => seen.push([finished, requested]));
    await library.ensure(['one', 'two', 'one']);
    expect(seen[0]).toEqual([0, 0]);
    expect(seen.at(-1)).toEqual([2, 2]);
    expect(seen.every(([finished, requested]) => finished <= requested)).toBe(true);
  });

  it('counts a file that failed as done so that the loader cannot stall', async () => {
    const library = libraryLoading({ good: 'ok', bad: 'fail' });
    const seen: [number, number][] = [];
    library.onProgress((finished, requested) => seen.push([finished, requested]));
    await expect(library.ensure(['good', 'bad'])).rejects.toThrow('cannot load bad');
    await Promise.resolve();
    expect(seen.at(-1)).toEqual([2, 2]);
  });

  it('stops reporting once unsubscribed', async () => {
    const library = libraryLoading({ one: 'ok' });
    const listener = vi.fn();
    const stop = library.onProgress(listener);
    stop();
    listener.mockClear();
    await library.ensure(['one']);
    expect(listener).not.toHaveBeenCalled();
  });
});
