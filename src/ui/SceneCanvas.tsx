import { useEffect, useRef } from 'react';
import { GameScene } from '../scene/GameScene';
import { prefsStore } from '../i18n/prefsStore';
import { gameStore } from '../store/gameStore';
import { sceneHandle } from '../store/sceneHandle';
import { uiStore } from '../store/uiStore';
import { selectionGhost } from '../tools/tools';
import { hideSplash } from './splash';

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new GameScene(canvas);
    sceneHandle.current = scene;
    scene.setHandlers({
      onTap: (tile) => {
        if (uiStore.getState().tool) return scene.focusOnTile(tile);
        uiStore.getState().tapTile(tile);
      },
      onCenterTileChange: (tile) => uiStore.getState().setCenterTile(tile),
    });
    void scene.ready.then(hideSplash);
    scene.setState(gameStore.getState().state);
    scene.setGhost(uiStore.getState().evaluation?.ghost ?? null);
    scene.setTrafficEnabled(prefsStore.getState().traffic);
    const showSelection = () => scene.setSelection(selectionGhost(gameStore.getState().state, uiStore.getState().selectedBuildingId));
    showSelection();
    const unsubscribeGame = gameStore.subscribe((store) => {
      scene.setState(store.state);
      showSelection();
    });
    const unsubscribeUi = uiStore.subscribe((store, previous) => {
      if (store.evaluation !== previous.evaluation) scene.setGhost(store.evaluation?.ghost ?? null);
      if (store.selectedBuildingId !== previous.selectedBuildingId) showSelection();
    });
    const unsubscribePrefs = prefsStore.subscribe((prefs) => scene.setTrafficEnabled(prefs.traffic));
    return () => {
      unsubscribeGame();
      unsubscribePrefs();
      unsubscribeUi();
      sceneHandle.current = null;
      scene.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="scene-canvas" />;
}
