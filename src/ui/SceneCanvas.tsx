import { useEffect, useRef } from 'react';
import { GameScene } from '../scene/GameScene';
import { gameStore } from '../store/gameStore';
import { sceneHandle } from '../store/sceneHandle';

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new GameScene(canvas);
    sceneHandle.current = scene;
    scene.setState(gameStore.getState().state);
    const unsubscribe = gameStore.subscribe((store) => scene.setState(store.state));
    return () => {
      unsubscribe();
      sceneHandle.current = null;
      scene.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="scene-canvas" />;
}
