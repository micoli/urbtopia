import { useRef, type PointerEvent } from 'react';

const DOUBLE_TAP_MS = 350;

export function useDoubleTap(onDoubleTap: () => void) {
  const lastTapAt = useRef(0);
  return (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    const now = event.timeStamp;
    if (now - lastTapAt.current > DOUBLE_TAP_MS) {
      lastTapAt.current = now;
      return;
    }
    lastTapAt.current = 0;
    onDoubleTap();
  };
}
