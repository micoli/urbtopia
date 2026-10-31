import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { clampToViewport } from '../ui/layout/clampToViewport';
import { readDevToolsPosition, writeDevToolsPosition, type DevToolsPosition } from './devToolsStorage';

export function useDevToolsPosition(frame: RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<DevToolsPosition | null>(readDevToolsPosition);
  const grab = useRef<DevToolsPosition | null>(null);
  const latest = useRef<DevToolsPosition | null>(null);

  const clamp = (target: DevToolsPosition): DevToolsPosition | null => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return null;
    return clampToViewport(target, rect, { width: globalThis.innerWidth, height: globalThis.innerHeight });
  };

  useEffect(() => {
    const keepInside = () => setPosition((current) => (current ? clamp(current) ?? current : current));
    keepInside();
    globalThis.addEventListener('resize', keepInside);
    return () => globalThis.removeEventListener('resize', keepInside);
  }, []);

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    grab.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<HTMLElement>) => {
    if (!grab.current) return;
    const next = clamp({ x: event.clientX - grab.current.x, y: event.clientY - grab.current.y });
    if (!next) return;
    latest.current = next;
    setPosition(next);
  };

  const endDrag = () => {
    if (!grab.current) return;
    grab.current = null;
    if (latest.current) writeDevToolsPosition(latest.current);
  };

  return { position, handleProps: { onPointerDown: startDrag, onPointerMove: drag, onPointerUp: endDrag, onPointerCancel: endDrag } };
}
