import { createStore } from 'zustand/vanilla';
import { footprintTiles, type Coord, type Rotation } from '../core';
import { prefsStore } from '../i18n/prefsStore';
import { aimTile, type PointerKind } from '../tools/aim';
import { confirmTool, evaluateTool, type Evaluation, type Tool } from '../tools/tools';
import { gameStore } from './gameStore';
import { sceneHandle } from './sceneHandle';
import { toastStore } from './toastStore';

export type Flyout = 'build' | 'roads' | null;

export interface UiStore {
  tool: Tool | null;
  rotation: Rotation | null;
  centerTile: Coord;
  pointerKind: PointerKind;
  hovered: Coord | null;
  selectedBuildingId: number | null;
  flyout: Flyout;
  marketOpen: boolean;
  menuOpen: boolean;
  pendingSaleId: number | null;
  evaluation: Evaluation | null;
  openFlyout: (flyout: Flyout) => void;
  toggleMarket: () => void;
  toggleMenu: () => void;
  chooseTool: (tool: Tool) => void;
  cancelTool: () => void;
  rotate: () => void;
  confirm: (keepTool?: boolean) => void;
  setCenterTile: (tile: Coord) => void;
  setPointerKind: (kind: PointerKind) => void;
  hoverTile: (tile: Coord) => void;
  clickTile: (tile: Coord, keepTool?: boolean) => void;
  tapTile: (tile: Coord, buildingId?: number | null) => void;
  select: (id: number | null) => void;
  sellSelected: () => void;
  confirmSale: () => void;
  cancelSale: () => void;
  moveSelected: () => void;
}

const INITIAL_CENTER: Coord = { x: 64, y: 64 };

function evaluate(tool: Tool | null, tile: Coord, rotation: Rotation | null): Evaluation | null {
  if (!tool) return null;
  return evaluateTool(tool, { state: gameStore.getState().state, tile, rotation });
}

export const uiStore = createStore<UiStore>((set, get) => {
  const reevaluate = (patch: Partial<Pick<UiStore, 'tool' | 'rotation' | 'centerTile' | 'pointerKind' | 'hovered'>> = {}) => {
    const merged = { ...get(), ...patch };
    set({ ...patch, evaluation: evaluate(merged.tool, aimTile(merged.pointerKind, merged.hovered, merged.centerTile), merged.rotation) });
  };

  return {
    tool: null,
    rotation: null,
    centerTile: INITIAL_CENTER,
    pointerKind: 'touch',
    hovered: null,
    selectedBuildingId: null,
    flyout: null,
    marketOpen: false,
    menuOpen: false,
    pendingSaleId: null,
    evaluation: null,
    openFlyout: (flyout) => set({ flyout: get().flyout === flyout ? null : flyout }),
    toggleMenu: () => set({ menuOpen: !get().menuOpen, flyout: null }),
    toggleMarket: () => {
      if (!gameStore.getState().state.marketUnlocked) return toastStore.getState().show('error.marketLocked');
      set({ marketOpen: !get().marketOpen, flyout: null });
    },
    chooseTool: (tool) => {
      set({ flyout: null, selectedBuildingId: null });
      reevaluate({ tool, rotation: null });
    },
    cancelTool: () => reevaluate({ tool: null, rotation: null }),
    rotate: () => {
      const { tool, evaluation } = get();
      if (tool?.kind === 'road' || tool?.kind === 'demolishRoad') return reevaluate({ tool: { ...tool, horizontalFirst: !tool.horizontalFirst } });
      if (evaluation?.rotation == null) return;
      reevaluate({ rotation: ((evaluation.rotation + 1) % 4) as Rotation });
    },
    confirm: (keepTool = false) => {
      const { tool, evaluation, pointerKind, hovered, centerTile } = get();
      if (!tool || !evaluation) return;
      const outcome = confirmTool(tool, aimTile(pointerKind, hovered, centerTile), evaluation, keepTool);
      if (!outcome.command && !evaluation.valid && evaluation.issue) return toastStore.getState().show(evaluation.issue);
      if (outcome.command) gameStore.getState().send(outcome.command);
      reevaluate({ tool: outcome.nextTool, rotation: outcome.nextTool?.kind === 'building' ? get().rotation : null });
    },
    setCenterTile: (tile) => reevaluate({ centerTile: tile }),
    setPointerKind: (kind) => {
      if (kind !== get().pointerKind) reevaluate({ pointerKind: kind });
    },
    hoverTile: (tile) => {
      const { hovered } = get();
      if (hovered?.x === tile.x && hovered.y === tile.y) return;
      reevaluate({ hovered: tile });
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
      set({ selectedBuildingId: null });
      sceneHandle.current?.focusOnTile(tile);
      reevaluate({ tool: { kind: 'move', buildingId: building.id }, rotation: null, centerTile: tile, hovered: null });
    },
  };
});

gameStore.subscribe(() => {
  const { tool, centerTile, pointerKind, hovered, rotation } = uiStore.getState();
  uiStore.setState({ evaluation: evaluate(tool, aimTile(pointerKind, hovered, centerTile), rotation) });
});
