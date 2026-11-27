import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { puzzleSceneHandle } from '../../store/puzzleSceneHandle';
import { puzzleStore, type DropTarget } from '../../store/puzzleStore';
import { PuzzlePartIcon } from './PuzzlePartIcon';

const DRAG_DISTANCE = 6;

// Over the board the ghost of the Part shows where it would land, so the chip steps aside.
const isOverBoard = (x: number, y: number): boolean => document.elementFromPoint(x, y)?.closest('.puzzle-canvas') != null;

// Follows the pointer while a Part is pressed: once it has moved enough the press is a drag, a chip with the name of the Part follows it, and letting go drops the Part on the board, on the
// tray (which takes a Part of the board back) or nowhere.
export function PuzzleDragLayer() {
  const armed = useStore(puzzleStore, (store) => store.drag !== null);
  const kind = useStore(puzzleStore, (store) => {
    const source = store.drag?.source;
    if (!source) return undefined;
    return 'kind' in source ? source.kind : store.editor.parts.find((part) => part.at.x === source.cell.x && part.at.y === source.cell.y)?.kind;
  });
  const active = useStore(puzzleStore, (store) => store.drag?.active ?? false);
  const chip = useRef<HTMLDivElement>(null);
  const last = useRef({ x: 0, y: 0 });

  // The chip appears after the first move that made the press a drag: put it under the pointer at once.
  useLayoutEffect(() => {
    if (!active || !chip.current) return;
    chip.current.style.transform = `translate(${last.current.x}px, ${last.current.y}px)`;
    chip.current.style.visibility = isOverBoard(last.current.x, last.current.y) ? 'hidden' : 'visible';
  }, [active]);

  useEffect(() => {
    if (!armed) return;
    const place = (x: number, y: number) => {
      last.current = { x, y };
      if (!chip.current) return;
      chip.current.style.transform = `translate(${x}px, ${y}px)`;
      chip.current.style.visibility = isOverBoard(x, y) ? 'hidden' : 'visible';
    };
    const move = (event: PointerEvent) => {
      const store = puzzleStore.getState();
      const start = store.drag?.start ?? { x: event.clientX, y: event.clientY };
      if (!store.drag?.active && Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_DISTANCE) store.activateDrag();
      if (!puzzleStore.getState().drag?.active) return;
      place(event.clientX, event.clientY);
      const cell = puzzleSceneHandle.current?.cellAtPoint(event.clientX, event.clientY);
      const over = puzzleStore.getState().drag?.over;
      if (cell?.x !== over?.x || cell?.y !== over?.y) store.dragOver(cell);
    };
    const target = (event: PointerEvent): DropTarget => {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      if (element?.closest('.puzzle-tray')) return 'tray';
      const cell = puzzleSceneHandle.current?.cellAtPoint(event.clientX, event.clientY);
      return cell ? { cell } : null;
    };
    const release = (event: PointerEvent) => {
      const store = puzzleStore.getState();
      if (store.drag?.active) store.dropDrag(target(event));
      else store.cancelDrag();
    };
    const cancel = () => puzzleStore.getState().cancelDrag();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [armed]);

  // Fixed positions are measured from the nearest transformed ancestor, which the dialog is: the chip lives on the page itself to sit under the pointer.
  if (!active || !kind) return null;
  return createPortal(<div ref={chip} className="puzzle-drag-chip" aria-hidden="true"><PuzzlePartIcon kind={kind} /></div>, document.body);
}
