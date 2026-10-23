import { useEffect, useRef } from 'react';
import { GameScene } from '../../scene/GameScene';
import { prefsStore } from '../../i18n/prefsStore';
import { gameStore } from '../../store/gameStore';
import { harvestEffects } from '../../store/harvestEffects';
import { sceneHandle } from '../../store/sceneHandle';
import { uiStore } from '../../store/uiStore';
import { pointerKindOf } from '../../tools/aim';
import { FACILITIES, isFacilityType } from '../../core';
import { selectionGhost } from '../../tools/tools';
import { hideSplash, setSplashProgress } from '../system/splash';

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new GameScene(canvas);
    sceneHandle.current = scene;
    scene.setHandlers({
      onTap: (tile, shiftKey, buildingId) => {
        const ui = uiStore.getState();
        if (ui.tool && ui.pointerKind === 'mouse') return ui.clickTile(tile, shiftKey);
        if (ui.tool) return ui.pinTile(tile);
        ui.tapTile(tile, buildingId);
      },
      onLongPress: (buildingId) => {
        const ui = uiStore.getState();
        if (ui.tool) return false;
        ui.select(buildingId);
        ui.moveSelected();
        return true;
      },
      onCenterTileChange: (tile) => uiStore.getState().setCenterTile(tile),
      onMouseMove: (tile) => uiStore.getState().hoverTile(tile),
      onPointerKind: (pointerType) => uiStore.getState().setPointerKind(pointerKindOf(pointerType)),
      onSecondaryClick: () => uiStore.getState().cancelTool(),
      onGrabStart: (tile) => uiStore.getState().grabGhost(tile),
      onGrabMove: (tile) => uiStore.getState().dragGhost(tile),
      onBrushStart: (tile) => uiStore.getState().brushStart(tile),
      onBrushMove: (tile) => uiStore.getState().brushMove(tile),
      onBrushEnd: () => uiStore.getState().brushEnd(),
      onBrushCancel: () => uiStore.getState().brushCancel(),
    });
    const unsubscribeLoading = scene.onLoadProgress(setSplashProgress);
    void scene.ready.then(hideSplash);
    scene.setState(gameStore.getState().state);
    const showServiceCoverage = () => scene.setServiceCoverage(uiStore.getState().serviceCoverageOpen ? prefsStore.getState().serviceCoverageType : null);
    showServiceCoverage();
    scene.setGhost(uiStore.getState().evaluation?.ghost ?? null);
    scene.setTrafficEnabled(prefsStore.getState().traffic);
    scene.setBrushMode(uiStore.getState().tool?.kind === 'brush');
    const showSelection = () => {
      const state = gameStore.getState().state;
      const selected = state.buildings.find(building => building.id === uiStore.getState().selectedBuildingId);
      scene.setSelection(selectionGhost(state, uiStore.getState().selectedBuildingId, prefsStore.getState().showReach, selected ? scene.drawnExtentOf(selected) : null));
      scene.setEcologicalSelection(uiStore.getState().selectedBuildingId);
      scene.setCoverageFocus(selected && prefsStore.getState().showReach && isFacilityType(selected.type) && FACILITIES[selected.type].radius !== null ? { type: selected.type, facilityId: selected.id } : null);
    };
    showSelection();
    const unsubscribeGame = gameStore.subscribe((store) => {
      scene.setState(store.state);
      showSelection();
    });
    const unsubscribeUi = uiStore.subscribe((store, previous) => {
      if (store.serviceCoverageOpen !== previous.serviceCoverageOpen) showServiceCoverage();
      if (store.tool?.kind !== previous.tool?.kind) scene.setBrushMode(store.tool?.kind === 'brush');
      if (store.evaluation !== previous.evaluation) scene.setGhost(store.evaluation?.ghost ?? null);
      if (store.selectedBuildingId !== previous.selectedBuildingId) showSelection();
    });
    const unsubscribeHarvest = harvestEffects.subscribe((effects) => scene.setAfterHarvest(effects.tiles));
    const unsubscribePrefs = prefsStore.subscribe((prefs, previous) => {
      if (prefs.serviceCoverageType !== previous.serviceCoverageType) showServiceCoverage();
      scene.setTrafficEnabled(prefs.traffic);
      if (prefs.showReach !== previous.showReach) showSelection();
    });
    return () => {
      unsubscribeLoading();
      unsubscribeGame();
      unsubscribePrefs();
      unsubscribeUi();
      unsubscribeHarvest();
      sceneHandle.current = null;
      scene.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="scene-canvas" />;
}
