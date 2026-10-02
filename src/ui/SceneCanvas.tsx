import { useEffect, useRef } from 'react';
import { GameScene } from '../scene/GameScene';
import { gameStore } from '../store/gameStore';
import { sceneHandle } from '../store/sceneHandle';
import { uiStore } from '../store/uiStore';

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
    scene.setState(gameStore.getState().state);
    scene.setGhost(uiStore.getState().evaluation?.ghost ?? null);
    const unsubscribeGame = gameStore.subscribe((store) => scene.setState(store.state));
    const unsubscribeUi = uiStore.subscribe((store, previous) => {
      if (store.evaluation !== previous.evaluation) scene.setGhost(store.evaluation?.ghost ?? null);
    });
    return () => {
      unsubscribeGame();
      unsubscribeUi();
      sceneHandle.current = null;
      scene.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="scene-canvas" />;
}
