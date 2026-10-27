import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal('window', { location: { search: '' } });
const { uiStore } = await import('./uiStore');
const { sceneHandle } = await import('./sceneHandle');
const { gameStore } = await import('./gameStore');
const { createBuilding } = await import('../core');

const shop = { kind: 'building', buildingType: 'shop' } as const;
const aimedTile = () => uiStore.getState().evaluation!.ghost.tiles.concat(uiStore.getState().evaluation!.ghost.rects.map((r) => ({ x: r.x, y: r.y })))[0]!;

describe('service coverage', () => {
  beforeEach(() => {
    uiStore.getState().cancelTool();
    uiStore.setState({ serviceCoverageOpen: false, statsOpen: false, selectedBuildingId: null });
  });

  it('starts disabled and opens from City management without leaving its modal open', () => {
    expect(uiStore.getInitialState().serviceCoverageOpen).toBe(false);
    uiStore.getState().toggleStats();
    uiStore.getState().openServiceCoverage();
    expect(uiStore.getState()).toMatchObject({ serviceCoverageOpen: true, statsOpen: false });
  });

  it('stays active during selection, construction, cancellation and reopening management', () => {
    uiStore.getState().openServiceCoverage();
    uiStore.getState().select(1);
    uiStore.getState().chooseTool(shop);
    expect(uiStore.getState().serviceCoverageOpen).toBe(true);
    uiStore.getState().cancelTool();
    uiStore.getState().toggleStats();
    expect(uiStore.getState().serviceCoverageOpen).toBe(true);
  });

  it('closes explicitly without cancelling the construction tool', () => {
    uiStore.getState().openServiceCoverage();
    uiStore.getState().chooseTool(shop);
    uiStore.getState().closeServiceCoverage();
    expect(uiStore.getState()).toMatchObject({ serviceCoverageOpen: false, tool: shop });
    uiStore.getState().cancelTool();
  });
});

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

describe('showTile', () => {
  beforeEach(() => {
    uiStore.setState({ statsOpen: true });
  });

  it('closes City Management and focuses the camera on the tile', () => {
    const focusOnTile = vi.fn();
    sceneHandle.current = { focusOnTile } as never;
    uiStore.getState().showTile({ x: 57, y: 58 });
    expect(uiStore.getState().statsOpen).toBe(false);
    expect(focusOnTile).toHaveBeenCalledWith({ x: 57, y: 58 });
    sceneHandle.current = null;
  });

  it('still closes the panel when no scene is mounted', () => {
    sceneHandle.current = null;
    uiStore.getState().showTile({ x: 1, y: 1 });
    expect(uiStore.getState().statsOpen).toBe(false);
  });
});

describe('social window', () => {
  beforeEach(() => uiStore.setState({ socialOpen: false, statsOpen: false, socialTab: 'friends', flyout: null, settingsOpen: false, marketOpen: false }));

  it('opens and closes, one modal at a time with the city management', () => {
    uiStore.getState().toggleStats();
    expect(uiStore.getState().statsOpen).toBe(true);
    uiStore.getState().toggleSocial();
    expect(uiStore.getState()).toMatchObject({ socialOpen: true, statsOpen: false });
    uiStore.getState().toggleStats();
    expect(uiStore.getState()).toMatchObject({ socialOpen: false, statsOpen: true });
    uiStore.getState().toggleStats();
    uiStore.getState().toggleSocial();
    uiStore.getState().toggleSocial();
    expect(uiStore.getState().socialOpen).toBe(false);
  });

  it('opens on the first tab when connected, and on Friends when not', async () => {
    const { cloudStore } = await import('./cloudStore');
    const { socialStore } = await import('./socialStore');
    cloudStore.setState({ account: null });
    socialStore.setState({ status: 'idle' });
    uiStore.getState().toggleSocial();
    expect(uiStore.getState().socialTab).toBe('friends');
    uiStore.getState().toggleSocial();

    cloudStore.setState({ account: { userId: 'u', email: null } });
    uiStore.getState().toggleSocial();
    expect(uiStore.getState().socialTab).toBe('friends');
    uiStore.getState().toggleSocial();

    cloudStore.setState({ account: { userId: 'u', email: 'me@example.com' } });
    socialStore.setState({ status: 'no-handle' });
    uiStore.getState().toggleSocial();
    expect(uiStore.getState().socialTab).toBe('profile');
    uiStore.getState().toggleSocial();

    socialStore.setState({ status: 'ready' });
    uiStore.getState().setSocialTab('friends');
    uiStore.getState().toggleSocial();
    expect(uiStore.getState().socialTab).toBe('exchanges');
    cloudStore.setState({ account: null });
    socialStore.setState({ status: 'idle' });
  });

  it('sends a signed-out player to Settings, and back to Social once signed in', async () => {
    const { cloudStore } = await import('./cloudStore');
    cloudStore.setState({ account: { userId: 'u', email: null } });
    uiStore.getState().toggleSocial();
    uiStore.getState().openSettingsFromSocial(true);
    expect(uiStore.getState()).toMatchObject({ socialOpen: false, settingsOpen: true, signInFromSocial: true });
    cloudStore.setState({ account: { userId: 'u', email: 'me@example.com' } });
    expect(uiStore.getState()).toMatchObject({ socialOpen: true, settingsOpen: false, signInFromSocial: false });
    uiStore.getState().toggleSocial();
    cloudStore.setState({ account: null });
  });

  it('does not reopen Social when Settings was closed before signing in', async () => {
    const { cloudStore } = await import('./cloudStore');
    cloudStore.setState({ account: { userId: 'u', email: null } });
    uiStore.getState().openSettingsFromSocial(true);
    uiStore.getState().toggleSettings();
    cloudStore.setState({ account: { userId: 'u', email: 'me@example.com' } });
    expect(uiStore.getState()).toMatchObject({ socialOpen: false, settingsOpen: false });
    cloudStore.setState({ account: null });
  });

  it('keeps the tab while the window stays open', () => {
    uiStore.getState().toggleSocial();
    uiStore.getState().setSocialTab('friends');
    expect(uiStore.getState().socialTab).toBe('friends');
    uiStore.getState().toggleSocial();
  });

  it('closes when the codex opens', () => {
    uiStore.getState().toggleSocial();
    uiStore.getState().openCodex();
    expect(uiStore.getState().socialOpen).toBe(false);
  });

  it('opens the codex on a rules page, and on the first entry without one', () => {
    uiStore.getState().openCodex(undefined, 'sanctions');
    expect(uiStore.getState().codexPage).toBe('sanctions');
    expect(uiStore.getState().codexShowDetail).toBe(true);
    uiStore.getState().closeCodex();
    uiStore.getState().openCodex();
    expect(uiStore.getState().codexPage).toBeNull();
    expect(uiStore.getState().codexShowDetail).toBe(false);
    uiStore.getState().closeCodex();
  });
});

describe('Codex opened from the Market', () => {
  it('comes back to the Market when the Codex closes', () => {
    uiStore.setState({ marketOpen: true });
    uiStore.getState().openCodex(undefined, 'market');
    expect(uiStore.getState().marketOpen).toBe(false);
    expect(uiStore.getState().codexPage).toBe('market');
    uiStore.getState().closeCodex();
    expect(uiStore.getState().marketOpen).toBe(true);
    uiStore.setState({ marketOpen: false });
  });

  it('leaves the Market closed when it was not open', () => {
    uiStore.setState({ marketOpen: false });
    uiStore.getState().openCodex(undefined, 'challenges');
    uiStore.getState().closeCodex();
    expect(uiStore.getState().marketOpen).toBe(false);
  });
});

describe('showBuilding', () => {
  beforeEach(() => {
    uiStore.setState({ statsOpen: true });
  });

  it('closes City Management, focuses the building and makes it flash', () => {
    const building = createBuilding(7, 'factory', 4, 5, 0);
    gameStore.getState().replaceState({ ...gameStore.getState().state, buildings: [building] });
    const focusOnTile = vi.fn();
    const flash = vi.fn();
    sceneHandle.current = { focusOnTile, flash, drawnExtentOf: () => null, arrowAnchorOf: () => ({ x: 4.5, y: 2, z: 5.5 }) } as never;
    uiStore.getState().showBuilding(building.id);
    expect(uiStore.getState().statsOpen).toBe(false);
    expect(focusOnTile).toHaveBeenCalledWith(building);
    expect(flash).toHaveBeenCalledOnce();
    expect(uiStore.getState().locator).toEqual({ x: 4.5, y: 2, z: 5.5 });
    sceneHandle.current = null;
  });

  it('does nothing for an unknown building', () => {
    const flash = vi.fn();
    sceneHandle.current = { focusOnTile: vi.fn(), flash } as never;
    uiStore.getState().showBuilding(-1);
    expect(uiStore.getState().statsOpen).toBe(true);
    expect(flash).not.toHaveBeenCalled();
    sceneHandle.current = null;
  });
});

describe('analytics view', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    uiStore.getState().exitAnalytics();
    uiStore.getState().cancelTool();
    uiStore.setState({ flyout: null, statsOpen: false, settingsOpen: false });
  });

  it('enters a layer, closing panels and the construction tool', () => {
    uiStore.getState().chooseTool(shop);
    uiStore.getState().enterAnalytics('data.pollution');
    expect(uiStore.getState()).toMatchObject({ analyticsLayer: 'data.pollution', lastAnalyticsLayer: 'data.pollution', tool: null, flyout: null });
  });

  it('leaves when another menu entry opens', () => {
    uiStore.getState().enterAnalytics('movement.cars');
    uiStore.getState().openFlyout('land');
    expect(uiStore.getState().analyticsLayer).toBeNull();
  });

  it('leaves when a tool is chosen, and from exitAnalytics', () => {
    uiStore.getState().enterAnalytics('movement.all');
    uiStore.getState().chooseTool(shop);
    expect(uiStore.getState().analyticsLayer).toBeNull();
    uiStore.getState().cancelTool();
    uiStore.getState().enterAnalytics('data.odor');
    uiStore.getState().exitAnalytics();
    expect(uiStore.getState().analyticsLayer).toBeNull();
  });
});

describe('analytics probe', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    uiStore.getState().exitAnalytics();
    uiStore.getState().cancelTool();
  });

  it('reads the tapped tile instead of selecting a building', () => {
    uiStore.getState().enterAnalytics('data.odor');
    uiStore.getState().tapTile({ x: 5, y: 6 }, 1);
    expect(uiStore.getState()).toMatchObject({ analyticsProbe: { x: 5, y: 6 }, selectedBuildingId: null });
  });

  it('follows the mouse, but not a touch', () => {
    uiStore.getState().enterAnalytics('data.odor');
    uiStore.getState().setPointerKind('touch');
    uiStore.getState().hoverTile({ x: 1, y: 1 });
    expect(uiStore.getState().analyticsProbe).toBeNull();
    uiStore.getState().setPointerKind('mouse');
    uiStore.getState().hoverTile({ x: 2, y: 3 });
    expect(uiStore.getState().analyticsProbe).toEqual({ x: 2, y: 3 });
  });

  it('forgets the probe when the view is left', () => {
    uiStore.getState().enterAnalytics('data.odor');
    uiStore.getState().tapTile({ x: 5, y: 6 });
    uiStore.getState().exitAnalytics();
    expect(uiStore.getState().analyticsProbe).toBeNull();
  });
});

describe('move mode', () => {
  beforeEach(() => {
    uiStore.getState().cancelTool();
    uiStore.setState({ moveMode: false, selectedBuildingId: null });
  });

  it('starts moving the tapped building without selecting it, and stays on after the move', () => {
    const state = gameStore.getState().state;
    const building = createBuilding(7, 'shop', 10, 10, 0);
    gameStore.getState().replaceState({ ...state, buildings: [building] });
    uiStore.getState().toggleMoveMode();
    uiStore.getState().tapTile({ x: 10, y: 10 });
    expect(uiStore.getState()).toMatchObject({ tool: { kind: 'move', buildingId: building.id }, selectedBuildingId: null, moveMode: true });
    uiStore.getState().cancelTool();
    expect(uiStore.getState().moveMode).toBe(true);
  });

  it('selects on tap when off, and cancels a move in progress when turned off', () => {
    uiStore.getState().tapTile({ x: 10, y: 10 });
    expect(uiStore.getState().tool).toBeNull();
    uiStore.getState().toggleMoveMode();
    uiStore.getState().tapTile({ x: 10, y: 10 });
    uiStore.getState().toggleMoveMode();
    expect(uiStore.getState()).toMatchObject({ tool: null, moveMode: false });
  });
});
