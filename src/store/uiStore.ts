import { createStore } from 'zustand/vanilla';
import { footprintTiles, nextFront, type Coord, type CropId, type Rotation } from '../core';
import { prefsStore } from '../i18n/prefsStore';
import { aimTile, type PointerKind } from '../tools/aim';
import { confirmTool, evaluateTool, extendBrush, isPathTool, selectionGhost, type Evaluation, type GhostSpec, type Tool } from '../tools/tools';
import { defaultSocialTab } from '../social/defaultSocialTab';
import { cloudStore } from './cloudStore';
import { gameStore } from './gameStore';
import { sceneHandle } from './sceneHandle';
import { socialStore } from './socialStore';
import { toastStore } from './toastStore';
import type { CodexId } from '../codex/catalog';
import type { CodexPage } from '../codex/pages';

export interface LocatorPosition { x: number; y: number; z: number }

const LOCATOR_DURATION_MS = 2000;

export type Flyout = 'build' | 'roads' | null;
export type MarketTab = 'market' | 'events';
export type SocialTab = 'friends' | 'groups' | 'exchanges' | 'hall' | 'profile';

export interface UiStore {
  tool: Tool | null;
  rotation: Rotation | null;
  centerTile: Coord;
  pointerKind: PointerKind;
  hovered: Coord | null;
  pinnedTile: Coord | null;
  selectedBuildingId: number | null;
  flyout: Flyout;
  statsOpen: boolean;
  toggleStats: () => void;
  politicsOpen: boolean;
  openPolitics: () => void;
  closePolitics: () => void;
  serviceCoverageOpen: boolean;
  openServiceCoverage: () => void;
  closeServiceCoverage: () => void;
  locator: LocatorPosition | null;
  buildingSearchOpen: boolean;
  toggleBuildingSearch: () => void;
  closeBuildingSearch: () => void;
  socialOpen: boolean;
  socialTab: SocialTab;
  signInFromSocial: boolean;
  openSettingsFromSocial: (forSignIn: boolean) => void;
  openSettingsForSignIn: () => void;
  toggleSocial: () => void;
  setSocialTab: (tab: SocialTab) => void;
  tradeWith: string | null;
  startTrade: (userId: string) => void;
  clearTradeWith: () => void;
  showTile: (tile: Coord) => void;
  showBuilding: (id: number) => void;
  marketOpen: boolean;
  marketTab: MarketTab;
  setMarketTab: (tab: MarketTab) => void;
  settingsOpen: boolean;
  streetView: boolean;
  streetViewPicking: boolean;
  pickStreetView: () => void;
  cancelPickStreetView: () => void;
  dropStreetView: (tile: Coord) => void;
  exitStreetView: () => void;
  codexOpen: boolean;
  codexFromSettings: boolean;
  codexFromMarket: boolean;
  codexFromFlyout: Flyout;
  codexEntryId: CodexId;
  codexShowDetail: boolean;
  codexPage: CodexPage | null;
  openCodex: (entry?: CodexId, page?: CodexPage) => void;
  closeCodex: () => void;
  pendingSaleId: number | null;
  evaluation: Evaluation | null;
  openFlyout: (flyout: Flyout) => void;
  toggleMarket: () => void;
  toggleSettings: () => void;
  chooseTool: (tool: Tool) => void;
  cancelTool: () => void;
  rotate: () => void;
  confirm: (keepTool?: boolean) => void;
  setCenterTile: (tile: Coord) => void;
  setPointerKind: (kind: PointerKind) => void;
  selectedCrop: CropId | null;
  selectCrop: (crop: CropId) => void;
  brushStart: (tile: Coord) => void;
  brushMove: (tile: Coord) => void;
  brushEnd: () => void;
  brushCancel: () => void;
  hoverTile: (tile: Coord) => void;
  pinTile: (tile: Coord) => void;
  grabGhost: (tile: Coord) => boolean;
  dragGhost: (tile: Coord) => void;
  clickTile: (tile: Coord, keepTool?: boolean) => void;
  tapTile: (tile: Coord, buildingId?: number | null) => void;
  select: (id: number | null) => void;
  sellSelected: () => void;
  confirmSale: () => void;
  cancelSale: () => void;
  moveSelected: () => void;
}

const INITIAL_CENTER: Coord = { x: 64, y: 64 };

const GRAB_MARGIN = 1;

function ghostContains(ghost: GhostSpec, tile: Coord): boolean {
  const x = tile.x + 0.5, y = tile.y + 0.5;
  const near = (left: number, top: number, width: number, depth: number) =>
    x >= left - GRAB_MARGIN && x <= left + width + GRAB_MARGIN && y >= top - GRAB_MARGIN && y <= top + depth + GRAB_MARGIN;
  return ghost.tiles.some((t) => near(t.x, t.y, 1, 1)) || ghost.rects.some((r) => r.tone !== 'hint' && near(r.x, r.y, r.width, r.depth));
}

function evaluate(tool: Tool | null, tile: Coord, rotation: Rotation | null): Evaluation | null {
  if (!tool) return null;
  return evaluateTool(tool, { state: gameStore.getState().state, tile, rotation });
}

export const uiStore = createStore<UiStore>((set, get) => {
  const reevaluate = (patch: Partial<Pick<UiStore, 'tool' | 'rotation' | 'centerTile' | 'pointerKind' | 'hovered' | 'pinnedTile'>> = {}) => {
    const merged = { ...get(), ...patch };
    set({ ...patch, evaluation: evaluate(merged.tool, aimTile(merged.pointerKind, merged.hovered, merged.centerTile, merged.pinnedTile), merged.rotation) });
  };
  const clearIssue = () => {
    const { evaluation } = get();
    if (evaluation?.issue) set({ evaluation: { ...evaluation, issue: null } });
  };
  const leaveParcelMode = () => {
    if (get().tool?.kind === 'parcel') get().cancelTool();
  };
  let locatorTimer: ReturnType<typeof setTimeout> | undefined;
  const showLocator = (locator: LocatorPosition) => {
    clearTimeout(locatorTimer);
    set({ locator });
    locatorTimer = setTimeout(() => set({ locator: null }), LOCATOR_DURATION_MS);
  };
  let grabOffset: Coord = { x: 0, y: 0 };
  let stopWaitingForSignIn = () => {};

  return {
    tool: null,
    rotation: null,
    centerTile: INITIAL_CENTER,
    pointerKind: 'touch',
    hovered: null,
    pinnedTile: null,
    selectedBuildingId: null,
    flyout: null,
    statsOpen: false,
    politicsOpen: false,
    openPolitics: () => {
      get().cancelTool();
      set({ politicsOpen: true, statsOpen: false, socialOpen: false, flyout: null, settingsOpen: false, marketOpen: false });
    },
    closePolitics: () => set({ politicsOpen: false }),
    serviceCoverageOpen: false,
    openServiceCoverage: () => set({ serviceCoverageOpen: true, statsOpen: false }),
    closeServiceCoverage: () => set({ serviceCoverageOpen: false }),
    locator: null,
    buildingSearchOpen: false,
    toggleBuildingSearch: () => set({ buildingSearchOpen: !get().buildingSearchOpen }),
    closeBuildingSearch: () => set({ buildingSearchOpen: false }),
    toggleStats: () => {
      if (!get().statsOpen) get().cancelTool();
      set({ statsOpen: !get().statsOpen, socialOpen: false, flyout: null, settingsOpen: false, marketOpen: false });
    },
    socialOpen: false,
    socialTab: 'friends',
    toggleSocial: () => {
      const opening = !get().socialOpen;
      if (opening) get().cancelTool();
      const landing = opening ? { socialTab: defaultSocialTab({ hasEmail: Boolean(cloudStore.getState().account?.email), status: socialStore.getState().status }) } : {};
      set({ ...landing, socialOpen: opening, statsOpen: false, flyout: null, settingsOpen: false, marketOpen: false });
    },
    setSocialTab: (socialTab) => set({ socialTab }),
    signInFromSocial: false,
    openSettingsFromSocial: (forSignIn) => {
      leaveParcelMode();
      stopWaitingForSignIn();
      set({ socialOpen: false, settingsOpen: true, flyout: null, signInFromSocial: forSignIn });
      if (!forSignIn) return;
      stopWaitingForSignIn = cloudStore.subscribe((store) => {
        if (!store.account?.email) return;
        stopWaitingForSignIn();
        if (!get().signInFromSocial || !get().settingsOpen) return;
        set({ signInFromSocial: false });
        get().toggleSocial();
      });
    },
    openSettingsForSignIn: () => {
      leaveParcelMode();
      stopWaitingForSignIn();
      set({ socialOpen: false, statsOpen: false, marketOpen: false, settingsOpen: true, flyout: null, signInFromSocial: true });
    },
    tradeWith: null,
    startTrade: (userId) => set({ tradeWith: userId, socialTab: 'exchanges' }),
    clearTradeWith: () => set({ tradeWith: null }),
    marketOpen: false,
    marketTab: 'market',
    setMarketTab: (marketTab) => set({ marketTab }),
    settingsOpen: false,
    streetView: false,
    streetViewPicking: false,
    pickStreetView: () => {
      if (get().streetViewPicking) return get().cancelPickStreetView();
      get().cancelTool();
      set({ streetViewPicking: true, flyout: null, statsOpen: false, socialOpen: false, marketOpen: false, settingsOpen: false, selectedBuildingId: null });
    },
    cancelPickStreetView: () => set({ streetViewPicking: false }),
    dropStreetView: (tile) => {
      if (!sceneHandle.current?.enterStreetView(tile)) return toastStore.getState().show('streetView.noSidewalk');
      set({ streetView: true, streetViewPicking: false });
    },
    exitStreetView: () => {
      sceneHandle.current?.exitStreetView();
      set({ streetView: false });
    },
    codexOpen: false,
    codexFromSettings: false,
    codexFromMarket: false,
    codexFromFlyout: null,
    codexEntryId: 'home',
    codexShowDetail: false,
    codexPage: null,
    openCodex: (entry, page) => {
      get().cancelTool();
      set({ codexOpen: true, codexFromSettings: get().settingsOpen, codexFromMarket: get().marketOpen, codexFromFlyout: get().flyout, codexEntryId: entry ?? 'home', codexShowDetail: entry !== undefined || page !== undefined, codexPage: page ?? null, settingsOpen: false, marketOpen: false, statsOpen: false, socialOpen: false, flyout: null, selectedBuildingId: null });
    },
    closeCodex: () => set({ codexOpen: false, settingsOpen: get().codexFromSettings, marketOpen: get().codexFromMarket, flyout: get().codexFromFlyout, codexFromSettings: false, codexFromMarket: false, codexFromFlyout: null }),
    pendingSaleId: null,
    evaluation: null,
    openFlyout: (flyout) => {
      leaveParcelMode();
      set({ flyout: get().flyout === flyout ? null : flyout });
    },
    toggleSettings: () => {
      leaveParcelMode();
      set({ settingsOpen: !get().settingsOpen, flyout: null, signInFromSocial: false });
    },
    toggleMarket: () => {
      if (!gameStore.getState().state.marketUnlocked) return toastStore.getState().show('error.marketLocked');
      leaveParcelMode();
      set({ marketOpen: !get().marketOpen, flyout: null });
    },
    chooseTool: (tool) => {
      set({ flyout: null, selectedBuildingId: null });
      reevaluate({ tool, rotation: null, pinnedTile: null });
    },
    cancelTool: () => reevaluate({ tool: null, rotation: null, pinnedTile: null }),
    rotate: () => {
      const { tool, evaluation } = get();
      if (isPathTool(tool)) return reevaluate({ tool: { ...tool, horizontalFirst: !tool.horizontalFirst } });
      if (evaluation?.rotation == null) return;
      if (!evaluation.fronts) return reevaluate({ rotation: ((evaluation.rotation + 1) % 4) as Rotation });
      reevaluate({ rotation: nextFront(evaluation.fronts, evaluation.rotation) });
    },
    confirm: (keepTool = false) => {
      const { tool, evaluation, pointerKind, hovered, centerTile, pinnedTile } = get();
      if (!tool || !evaluation) return;
      const outcome = confirmTool(tool, aimTile(pointerKind, hovered, centerTile, pinnedTile), evaluation, keepTool);
      if (!outcome.command && !evaluation.valid && evaluation.issue) return toastStore.getState().show(evaluation.issue);
      if (outcome.command) gameStore.getState().send(outcome.command);
      reevaluate({ tool: outcome.nextTool, rotation: outcome.nextTool?.kind === 'building' ? get().rotation : null, ...(outcome.nextTool ? {} : { pinnedTile: null }) });
      if (outcome.command && tool.kind === 'brush') clearIssue();
    },
    setCenterTile: (tile) => reevaluate({ centerTile: tile }),
    setPointerKind: (kind) => {
      if (kind !== get().pointerKind) reevaluate({ pointerKind: kind });
    },
    selectedCrop: null,
    selectCrop: (crop) => {
      const { tool } = get();
      set({ selectedCrop: crop });
      if (tool?.kind === 'brush' && tool.action === 'plant') reevaluate({ tool: { ...tool, crop } });
    },
    brushStart: (tile) => {
      const { tool } = get();
      if (tool?.kind !== 'brush') return;
      reevaluate({ tool: extendBrush({ ...tool, tiles: [] }, tile), hovered: tile });
    },
    brushMove: (tile) => {
      const { tool } = get();
      if (tool?.kind !== 'brush') return;
      reevaluate({ tool: extendBrush(tool, tile), hovered: tile });
    },
    brushEnd: () => {
      if (get().tool?.kind !== 'brush') return;
      get().confirm();
    },
    brushCancel: () => {
      const { tool } = get();
      if (tool?.kind === 'brush') reevaluate({ tool: { ...tool, tiles: [] } });
    },
    hoverTile: (tile) => {
      const { hovered } = get();
      if (hovered?.x === tile.x && hovered.y === tile.y) return;
      reevaluate({ hovered: tile });
    },
    pinTile: (tile) => reevaluate({ pinnedTile: tile }),
    grabGhost: (tile) => {
      const { tool, evaluation, pointerKind, hovered, centerTile, pinnedTile } = get();
      if (!tool || tool.kind === 'brush' || !evaluation || pointerKind === 'mouse' || !ghostContains(evaluation.ghost, tile)) return false;
      const aim = aimTile(pointerKind, hovered, centerTile, pinnedTile);
      grabOffset = { x: aim.x - tile.x, y: aim.y - tile.y };
      return true;
    },
    dragGhost: (tile) => {
      const next = { x: tile.x + grabOffset.x, y: tile.y + grabOffset.y };
      const { pinnedTile } = get();
      if (pinnedTile?.x === next.x && pinnedTile.y === next.y) return;
      reevaluate({ pinnedTile: next });
    },
    clickTile: (tile, keepTool = false) => {
      reevaluate({ hovered: tile });
      get().confirm(keepTool);
    },
    tapTile: (tile, buildingId = null) => {
      if (get().tool) return;
      const building = gameStore.getState().state.buildings.find((candidate) => footprintTiles(candidate).some((t) => t.x === tile.x && t.y === tile.y));
      set({ selectedBuildingId: buildingId ?? building?.id ?? null, flyout: null });
    },
    select: (id) => set({ selectedBuildingId: id }),
    sellSelected: () => {
      const id = get().selectedBuildingId;
      if (id === null) return;
      if (prefsStore.getState().confirmSale) return set({ pendingSaleId: id });
      gameStore.getState().send({ type: 'SellBuilding', id });
      set({ selectedBuildingId: null });
    },
    confirmSale: () => {
      const id = get().pendingSaleId;
      set({ pendingSaleId: null });
      if (id === null) return;
      gameStore.getState().send({ type: 'SellBuilding', id });
      set({ selectedBuildingId: null });
    },
    cancelSale: () => set({ pendingSaleId: null }),
    showTile: (tile) => {
      set({ statsOpen: false });
      sceneHandle.current?.focusOnTile(tile);
    },
    showBuilding: (id) => {
      const state = gameStore.getState().state;
      const building = state.buildings.find((candidate) => candidate.id === id);
      if (!building) return;
      set({ statsOpen: false });
      const scene = sceneHandle.current;
      if (!scene) return;
      scene.focusOnTile(building);
      scene.flash(selectionGhost(state, id, false, scene.drawnExtentOf(building)));
      showLocator(scene.arrowAnchorOf(building));
    },
    moveSelected: () => {
      const id = get().selectedBuildingId;
      const building = gameStore.getState().state.buildings.find((candidate) => candidate.id === id);
      if (!building) return;
      const tile = { x: building.x, y: building.y };
      grabOffset = { x: 0, y: 0 };
      set({ selectedBuildingId: null });
      sceneHandle.current?.focusOnTile(tile);
      reevaluate({ tool: { kind: 'move', buildingId: building.id }, rotation: null, centerTile: tile, hovered: null, pinnedTile: null });
    },
  };
});

gameStore.subscribe(() => {
  const { tool, centerTile, pointerKind, hovered, pinnedTile, rotation } = uiStore.getState();
  uiStore.setState({ evaluation: evaluate(tool, aimTile(pointerKind, hovered, centerTile, pinnedTile), rotation) });
});
