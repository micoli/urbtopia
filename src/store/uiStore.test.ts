import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal('window', { location: { search: '' } });
const { uiStore } = await import('./uiStore');

const shop = { kind: 'building', buildingType: 'shop' } as const;
const aimedTile = () => uiStore.getState().evaluation!.ghost.tiles.concat(uiStore.getState().evaluation!.ghost.rects.map((r) => ({ x: r.x, y: r.y })))[0]!;

describe('touch placement', () => {
  beforeEach(() => {
    uiStore.getState().cancelTool();
    uiStore.setState({ pointerKind: 'touch', centerTile: { x: 64, y: 64 } });
    uiStore.getState().chooseTool(shop);
  });

  it('aims at the screen centre until a tile is pinned', () => {
    const before = aimedTile();
    uiStore.getState().pinTile({ x: 70, y: 60 });
    expect(aimedTile()).not.toEqual(before);
  });

  it('does not grab the ghost when the finger is far from it', () => {
    expect(uiStore.getState().grabGhost({ x: 100, y: 100 })).toBe(false);
  });

  it('grabs the ghost under the finger and moves it with the same offset', () => {
    const start = aimedTile();
    expect(uiStore.getState().grabGhost(start)).toBe(true);
    uiStore.getState().dragGhost({ x: start.x + 5, y: start.y - 3 });
    expect(uiStore.getState().pinnedTile).toEqual({ x: 69, y: 61 });
  });

  it('releases the pinned tile when the tool is cancelled', () => {
    uiStore.getState().pinTile({ x: 70, y: 60 });
    uiStore.getState().cancelTool();
    expect(uiStore.getState().pinnedTile).toBeNull();
  });
});
