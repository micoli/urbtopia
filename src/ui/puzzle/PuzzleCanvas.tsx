import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { restingTrajectory } from '../../core/dailyPuzzle/progress';
import type { Cell } from '../../core/dailyPuzzle/types';
import { PuzzleBoardScene } from '../../scene/puzzle/PuzzleBoardScene';
import { puzzleSceneHandle } from '../../store/puzzleSceneHandle';
import { puzzleStore } from '../../store/puzzleStore';
import type { PuzzleView } from './usePuzzleGame';

interface PuzzleCanvasProps {
  view: PuzzleView;
}

// The board of the Daily puzzle: the Parts as the player edits them, then the ball rolling over them when the player runs the machine.
export function PuzzleCanvas({ view }: PuzzleCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<PuzzleBoardScene | null>(null);
  const [hovered, setHovered] = useState<Cell | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const { puzzle, phase, parts, held, free, trajectory, willSolve } = view;
  const drag = useStore(puzzleStore, (store) => store.drag);
  const lifted = drag?.active && 'cell' in drag.source ? drag.source.cell : undefined;
  const shown = useMemo(() => (lifted ? parts.filter((part) => part.at.x !== lifted.x || part.at.y !== lifted.y) : parts), [parts, lifted]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    // A disposed scene loses its WebGL context for good, so every scene gets a fresh canvas.
    const canvas = document.createElement('canvas');
    canvas.className = 'puzzle-canvas';
    element.append(canvas);
    const created = new PuzzleBoardScene(canvas);
    created.onTap((cell) => puzzleStore.getState().tapCell(cell));
    created.onHover(setHovered);
    created.onPress((cell, x, y) => {
      const store = puzzleStore.getState();
      if (cell && store.editor.parts.some((part) => part.at.x === cell.x && part.at.y === cell.y)) store.armDrag({ cell }, { x, y });
    });
    scene.current = created;
    puzzleSceneHandle.current = created;
    void created.load().then(() => setReady(true));
    return () => {
      scene.current = null;
      if (puzzleSceneHandle.current === created) puzzleSceneHandle.current = null;
      setReady(false);
      created.dispose();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready || phase !== 'edit') return;
    void scene.current?.show(puzzle, shown, restingTrajectory(puzzle.board), false);
  }, [ready, phase, puzzle, shown]);

  useEffect(() => {
    if (!ready || phase !== 'edit') return;
    const dragging = drag?.active ? drag : undefined;
    const selected = !dragging && held && 'cell' in held ? held.cell : undefined;
    scene.current?.setMarks(free, selected);
    const kindAt = (cell: Cell) => parts.find((part) => part.at.x === cell.x && part.at.y === cell.y)?.kind;
    const kind = dragging ? ('kind' in dragging.source ? dragging.source.kind : kindAt(dragging.source.cell)) : held && 'kind' in held ? held.kind : undefined;
    const cell = dragging ? dragging.over : hovered;
    const isFree = cell !== undefined && free.some((candidate) => candidate.x === cell.x && candidate.y === cell.y);
    scene.current?.setGhost(kind && cell ? { kind, cell, valid: isFree } : null);
  }, [ready, phase, held, drag, free, hovered, parts]);

  useEffect(() => {
    if (!ready || phase !== 'run' || !trajectory) return;
    const board = scene.current;
    if (!board) return;
    board.setMarks([], undefined);
    board.setGhost(null);
    // Stopping the run drops this effect, possibly before the scene has finished building: nothing may start after that.
    let stopped = false;
    void board.show(puzzle, parts, trajectory, willSolve).then(() => {
      if (!stopped) board.play(() => puzzleStore.getState().finishRun(willSolve));
    });
    return () => {
      stopped = true;
      board.pause();
    };
  }, [ready, phase, puzzle, parts, trajectory, willSolve]);

  return <div ref={host} className="puzzle-board" data-testid="puzzle-board" />;
}
