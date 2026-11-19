import { useEffect, useRef } from 'react';
import type { Cell, PlacedHex } from '../../core';
import { districtSceneHandle } from '../../store/districtSceneHandle';
import { districtStore } from '../../store/districtStore';
import { DistrictPlanScene } from '../../scene/DistrictPlanScene';
import type { DistrictView } from './useDistrictGame';

interface DistrictCanvasProps {
  board: readonly PlacedHex[];
  candidates: readonly Cell[];
  picked: DistrictView['picked'];
  // A tap on the board picks a cell; a demonstration only looks.
  interactive: boolean;
  onAnchor?: (anchor: { x: number; y: number } | null) => void;
}

const pickedKeyOf = (picked: DistrictView['picked']): string => (picked ? `${picked.cell.q},${picked.cell.r},${picked.valid},${picked.hex.edges.join()}` : '');

export function DistrictCanvas({ board, candidates, picked, interactive, onAnchor }: DistrictCanvasProps) {
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
    if (interactive) created.onTap(cell => districtStore.getState().selectCell(cell));
    if (onAnchor) created.onAnchor(onAnchor);
    districtSceneHandle.current = created;
    const fit = () => created.resize(host.clientWidth, host.clientHeight);
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    fit();
    scene.current = created;
    return () => {
      observer.disconnect();
      if (districtSceneHandle.current === created) districtSceneHandle.current = null;
      created.dispose();
      canvas.remove();
      scene.current = null;
    };
  }, [interactive, onAnchor]);

  useEffect(() => {
    scene.current?.setBoard(board);
  }, [board, interactive]);

  useEffect(() => {
    scene.current?.setCandidates(candidates);
  }, [candidates, interactive]);

  // The key stands for the cell, the turn and the validity of the picked Hex.
  const pickedKey = pickedKeyOf(picked);
  useEffect(() => {
    scene.current?.setGhost(picked);
  }, [pickedKey, interactive]);

  return <div ref={container} className="district-board" data-testid="district-board" />;
}
