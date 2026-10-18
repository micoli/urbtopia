import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { MapBounds } from './transportMapModel.ts';

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PADDING = 3;
// Labels are centred under their stop and may be wider than the stop is far from the edge.
const SIDE_PADDING_RATIO = 0.12;
const MIN_SIZE = 12;
const ZOOM_STEP = 1.15;
const MIN_WIDTH = 6;
const MAX_WIDTH = 400;

export function fitViewBox(bounds: MapBounds): ViewBox {
  const span = bounds.maxX - bounds.minX;
  const sidePadding = Math.max(PADDING, span * SIDE_PADDING_RATIO);
  const width = Math.max(MIN_SIZE, span + 2 * sidePadding);
  const height = Math.max(MIN_SIZE, bounds.maxY - bounds.minY + 2 * PADDING);
  return { x: (bounds.minX + bounds.maxX) / 2 - width / 2, y: (bounds.minY + bounds.maxY) / 2 - height / 2, width, height };
}

export function zoomViewBox(view: ViewBox, factor: number, focus: { x: number; y: number }): ViewBox {
  const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, view.width * factor));
  const scale = width / view.width;
  return { x: focus.x - (focus.x - view.x) * scale, y: focus.y - (focus.y - view.y) * scale, width, height: view.height * scale };
}

export function useMapViewport(bounds: MapBounds, svg: RefObject<SVGSVGElement | null>) {
  const fitted = fitViewBox(bounds);
  const [view, setView] = useState<ViewBox | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const current = view ?? fitted;

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      setView(previous => {
        const base = previous ?? fitted;
        const focus = { x: base.x + (event.clientX - rect.left) / rect.width * base.width, y: base.y + (event.clientY - rect.top) / rect.height * base.height };
        return zoomViewBox(base, event.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP, focus);
      });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [svg, fitted.x, fitted.y, fitted.width, fitted.height]);

  const onPointerDown = useCallback((event: PointerEvent<SVGSVGElement>) => {
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);
  const onPointerMove = useCallback((event: PointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    if (!start) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY };
    setView(previous => {
      const base = previous ?? fitted;
      return { ...base, x: base.x - (event.clientX - start.x) / rect.width * base.width, y: base.y - (event.clientY - start.y) / rect.height * base.height };
    });
  }, [fitted.x, fitted.y, fitted.width, fitted.height]);
  const onPointerUp = useCallback(() => { drag.current = null; }, []);
  const fit = useCallback(() => setView(null), []);

  return { view: current, fit, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}
