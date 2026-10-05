import { createStore } from 'zustand/vanilla';
import { footprintTiles, type Coord, type CropId, type Rotation } from '../core';
import { prefsStore } from '../i18n/prefsStore';
import { aimTile, type PointerKind } from '../tools/aim';
import { confirmTool, evaluateTool, extendBrush, type Evaluation, type GhostSpec, type Tool } from '../tools/tools';
import { gameStore } from './gameStore';
import { sceneHandle } from './sceneHandle';
import { toastStore } from './toastStore';
import type { CodexId } from '../codex/catalog';

export type Flyout = 'build' | 'roads' | null;

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
  marketOpen: boolean;
  settingsOpen: boolean;
  codexOpen: boolean;
  codexFromSettings: boolean;
  codexFromFlyout: Flyout;
  codexEntryId: CodexId;
  codexShowDetail: boolean;
  openCodex: (entry?: CodexId) => void;
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
  let grabOffset: Coord = { x: 0, y: 0 };

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
    toggleStats: () => {
      if (!get().statsOpen) get().cancelTool();
      set({ statsOpen: !get().statsOpen, flyout: null, settingsOpen: false, marketOpen: false });
    },
    marketOpen: false,
    settingsOpen: false,
    codexOpen: false,
    codexFromSettings: false,
    codexFromFlyout: null,
    codexEntryId: 'home',
    codexShowDetail: false,
    openCodex: (entry) => {
      get().cancelTool();
      set({ codexOpen: true, codexFromSettings: get().settingsOpen, codexFromFlyout: get().flyout, codexEntryId: entry ?? 'home', codexShowDetail: entry !== undefined, settingsOpen: false, marketOpen: false, statsOpen: false, flyout: null, selectedBuildingId: null });
    },
    closeCodex: () => set({ codexOpen: false, settingsOpen: get().codexFromSettings, flyout: get().codexFromFlyout, codexFromSettings: false, codexFromFlyout: null }),
    pendingSaleId: null,
    evaluation: null,
    openFlyout: (flyout) => {
      leaveParcelMode();
      set({ flyout: get().flyout === flyout ? null : flyout });
    },
    toggleSettings: () => {
      leaveParcelMode();
      set({ settingsOpen: !get().settingsOpen, flyout: null });
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
      if (tool?.kind === 'road' || tool?.kind === 'demolishRoad') return reevaluate({ tool: { ...tool, horizontalFirst: !tool.horizontalFirst } });
      if (evaluation?.rotation == null) return;
      reevaluate({ rotation: ((evaluation.rotation + 1) % 4) as Rotation });
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
