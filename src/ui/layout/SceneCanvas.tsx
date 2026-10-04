import { useEffect, useRef } from 'react';
import { GameScene } from '../../scene/GameScene';
import { prefsStore } from '../../i18n/prefsStore';
import { gameStore } from '../../store/gameStore';
import { harvestEffects } from '../../store/harvestEffects';
import { sceneHandle } from '../../store/sceneHandle';
import { uiStore } from '../../store/uiStore';
import { pointerKindOf } from '../../tools/aim';
import { selectionGhost } from '../../tools/tools';
import { hideSplash } from '../system/splash';

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
        if (ui.tool) return scene.focusOnTile(tile);
        ui.tapTile(tile, buildingId);
      },
      onCenterTileChange: (tile) => uiStore.getState().setCenterTile(tile),
      onMouseMove: (tile) => uiStore.getState().hoverTile(tile),
      onPointerKind: (pointerType) => uiStore.getState().setPointerKind(pointerKindOf(pointerType)),
      onSecondaryClick: () => uiStore.getState().cancelTool(),
      onBrushStart: (tile) => uiStore.getState().brushStart(tile),
      onBrushMove: (tile) => uiStore.getState().brushMove(tile),
      onBrushEnd: () => uiStore.getState().brushEnd(),
      onBrushCancel: () => uiStore.getState().brushCancel(),
    });
    void scene.ready.then(hideSplash);
    scene.setState(gameStore.getState().state);
    scene.setGhost(uiStore.getState().evaluation?.ghost ?? null);
    scene.setTrafficEnabled(prefsStore.getState().traffic);
    scene.setBrushMode(uiStore.getState().tool?.kind === 'brush');
    const showSelection = () => {
      scene.setSelection(selectionGhost(gameStore.getState().state, uiStore.getState().selectedBuildingId));
      scene.setEcologicalSelection(uiStore.getState().selectedBuildingId);
    };
    showSelection();
    const unsubscribeGame = gameStore.subscribe((store) => {
      scene.setState(store.state);
      showSelection();
    });
    const unsubscribeUi = uiStore.subscribe((store, previous) => {
      if (store.tool?.kind !== previous.tool?.kind) scene.setBrushMode(store.tool?.kind === 'brush');
      if (store.evaluation !== previous.evaluation) scene.setGhost(store.evaluation?.ghost ?? null);
      if (store.selectedBuildingId !== previous.selectedBuildingId) showSelection();
    });
    const unsubscribeHarvest = harvestEffects.subscribe((effects) => scene.setAfterHarvest(effects.tiles));
    const unsubscribePrefs = prefsStore.subscribe((prefs) => scene.setTrafficEnabled(prefs.traffic));
    return () => {
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
