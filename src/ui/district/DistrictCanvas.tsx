import { useEffect, useRef } from 'react';
import { districtStore } from '../../store/districtStore';
import { DistrictPlanScene } from '../../scene/DistrictPlanScene';
import type { DistrictView } from './useDistrictGame';

interface DistrictCanvasProps {
  view: DistrictView;
}

export function DistrictCanvas({ view }: DistrictCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const scene = useRef<DistrictPlanScene | null>(null);

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    // A disposed scene loses its WebGL context for good, so every scene gets a fresh canvas.
    const canvas = document.createElement('canvas');
    canvas.className = 'district-canvas';
    host.append(canvas);
    const created = new DistrictPlanScene(canvas);
    created.onTap(cell => districtStore.getState().selectCell(cell));
    const fit = () => created.resize(host.clientWidth, host.clientHeight);
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    fit();
    scene.current = created;
    return () => {
      observer.disconnect();
      created.dispose();
      canvas.remove();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    scene.current?.setBoard(view.board);
  }, [view.board]);

  useEffect(() => {
    scene.current?.setCandidates(view.candidates);
  }, [view.candidates]);

  useEffect(() => {
    scene.current?.setGhost(view.picked);
  }, [view.picked?.cell.q, view.picked?.cell.r, view.picked?.valid, view.current]);

  return <div ref={container} className="district-board" data-testid="district-board" />;
}
