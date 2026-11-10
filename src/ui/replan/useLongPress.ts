import { useRef, type MouseEvent, type PointerEvent } from 'react';

const DELAY_MS = 500;

// A press held for half a second, or a right click, calls `onLongPress` and swallows the click that follows it.
export function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      fired.current = false;
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, DELAY_MS);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
      clear();
      fired.current = true;
      onLongPress();
    },
    onClickCapture: (event: MouseEvent) => {
      if (!fired.current) return;
      fired.current = false;
      event.stopPropagation();
      event.preventDefault();
    },
  };
}
