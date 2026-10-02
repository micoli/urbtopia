import { createStore } from 'zustand/vanilla';
import { footprintTiles, isStorageEmpty, type Coord, type Rotation } from '../core';
import { confirmTool, evaluateTool, type Evaluation, type Tool } from '../tools/tools';
import { gameStore } from './gameStore';
import { toastStore } from './toastStore';

export type Flyout = 'build' | 'roads' | null;

export interface UiStore {
  tool: Tool | null;
  rotation: Rotation | null;
  centerTile: Coord;
  selectedBuildingId: number | null;
  flyout: Flyout;
  marketOpen: boolean;
  pendingSaleId: number | null;
  evaluation: Evaluation | null;
  openFlyout: (flyout: Flyout) => void;
  toggleMarket: () => void;
  chooseTool: (tool: Tool) => void;
  cancelTool: () => void;
  rotate: () => void;
  confirm: () => void;
  setCenterTile: (tile: Coord) => void;
  tapTile: (tile: Coord) => void;
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
  const reevaluate = (patch: Partial<Pick<UiStore, 'tool' | 'rotation' | 'centerTile'>> = {}) => {
    const merged = { ...get(), ...patch };
    set({ ...patch, evaluation: evaluate(merged.tool, merged.centerTile, merged.rotation) });
  };

  return {
    tool: null,
    rotation: null,
    centerTile: INITIAL_CENTER,
    selectedBuildingId: null,
    flyout: null,
    marketOpen: false,
    pendingSaleId: null,
    evaluation: null,
    openFlyout: (flyout) => set({ flyout: get().flyout === flyout ? null : flyout }),
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
      if (tool?.kind === 'road') return reevaluate({ tool: { ...tool, horizontalFirst: !tool.horizontalFirst } });
      if (evaluation?.rotation == null) return;
      reevaluate({ rotation: ((evaluation.rotation + 1) % 4) as Rotation });
    },
    confirm: () => {
      const { tool, evaluation, centerTile } = get();
      if (!tool || !evaluation) return;
      const outcome = confirmTool(tool, centerTile, evaluation);
      if (!outcome.command && !evaluation.valid && evaluation.issue) return toastStore.getState().show(evaluation.issue);
      if (outcome.command) gameStore.getState().send(outcome.command);
      reevaluate({ tool: outcome.nextTool, rotation: outcome.nextTool?.kind === 'building' ? get().rotation : null });
    },
    setCenterTile: (tile) => reevaluate({ centerTile: tile }),
    tapTile: (tile) => {
      if (get().tool) return;
      const building = gameStore.getState().state.buildings.find((candidate) => footprintTiles(candidate).some((t) => t.x === tile.x && t.y === tile.y));
      set({ selectedBuildingId: building?.id ?? null, flyout: null });
    },
    select: (id) => set({ selectedBuildingId: id }),
    sellSelected: () => {
      const id = get().selectedBuildingId;
      if (id === null) return;
      const game = gameStore.getState().state;
      const building = game.buildings.find((candidate) => candidate.id === id);
      const needsConfirmation = building && ((building.type === 'home' && building.tier >= 3) || (building.type === 'storehouse' && !isStorageEmpty(game.storage)));
      if (needsConfirmation) return set({ pendingSaleId: id });
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
      if (id === null) return;
      set({ selectedBuildingId: null });
      reevaluate({ tool: { kind: 'move', buildingId: id }, rotation: null });
    },
  };
});

gameStore.subscribe(() => {
  const { tool, centerTile, rotation } = uiStore.getState();
  uiStore.setState({ evaluation: evaluate(tool, centerTile, rotation) });
});
