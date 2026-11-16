import { useEffect, useRef, useState, type RefObject } from 'react';
import { fixtureTiles, fixtureVenueOf, hasLineInterior, hasProductionInterior, hasServiceInterior, interiorBonusOfBuilding, interiorFixturesOf, interiorMotionOf, interiorOverloadedOf, interiorSizeOf, avatarsOfBuilding, isBroken, linePathsOf, type Building, type Coord } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { VenueScene } from '../../scene/VenueScene';

interface Props {
  initial: Building;
  building: Building;
  highlight: readonly Coord[];
  camera?: { x: number; y: number; zoom: number };
  playing: boolean;
  sceneRef: RefObject<VenueScene | null>;
  onReady: () => void;
}

const FOCUS_ZOOM = 2;
const FOCUS_DURATION = 900;
const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

export function DemonstrationCanvas({ initial, building, highlight, camera, playing, sceneRef, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // A disposed scene loses its WebGL context for good, so every scene gets a fresh canvas (HMR and dependency changes re-run this effect).
    const canvas = document.createElement('canvas');
    canvas.className = 'demonstration-canvas';
    canvasRef.current = canvas;
    container.append(canvas);
    const scene = new VenueScene(canvas, interiorSizeOf(initial), initial.tier, fixtureVenueOf(initial), initial.id);
    sceneRef.current = scene;
    scene.setAnimationPaused(true);
    scene.setMarksBelowFixtures(true);
    scene.setShadows(prefsStore.getState().sunShadows);
    scene.recenter(cameraRef.current?.x, cameraRef.current?.y, cameraRef.current?.zoom);
    // No edit or picking callbacks: all game actions belong to the script.
    let disposed = false;
    void scene.ready.then(() => { if (disposed) return; setLoaded(true); onReady(); });
    return () => {
      disposed = true;
      sceneRef.current = null;
      scene.dispose();
      canvas.remove();
    };
  }, [initial, sceneRef, onReady]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const fixtures = interiorFixturesOf(building);
    const speed = 1 + interiorBonusOfBuilding(building).speed;
    scene.setFixtures(fixtures);
    scene.setSelection(highlight);
    scene.setMotion(hasProductionInterior(building) ? interiorMotionOf(fixtures) : new Map(), speed);
    scene.setLine(hasLineInterior(building) ? linePathsOf(fixtures) : [], speed);
    scene.setAvatars(hasServiceInterior(building) ? avatarsOfBuilding(building) : []);
    const overloaded = interiorOverloadedOf(fixtures);
    scene.setBroken(fixtures.filter(fixture => isBroken(fixture) || overloaded.has(fixture.id)).flatMap(fixtureTiles));
    scene.setWear([...fixtures], hasProductionInterior(building));
    scene.setAnimationPaused(!playing);
  }, [building, playing, highlight, sceneRef]);

  // Move smoothly onto the piece the step manipulates, or to the camera the step sets.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!loaded || !scene || (!camera && highlight.length === 0)) return;
    const from = scene.getView();
    const to = camera ?? { ...scene.panToTiles(highlight), zoom: Math.max(from.zoom, FOCUS_ZOOM) };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scene.setView(to.x, to.y, to.zoom);
      return;
    }
    const start = performance.now();
    let handle = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / FOCUS_DURATION);
      const eased = easeOutCubic(progress);
      scene.setView(from.x + (to.x - from.x) * eased, from.y + (to.y - from.y) * eased, from.zoom + (to.zoom - from.zoom) * eased);
      if (progress < 1) handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [loaded, highlight, camera, sceneRef]);

  useEffect(() => { canvasRef.current?.setAttribute('aria-label', t('demo.view')); });

  return <div ref={containerRef} className="demonstration-canvas-container" />;
}
