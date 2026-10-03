import { useEffect, useMemo, useRef } from 'react';
import { footprintOf, isWorking } from '../core';
import { sceneHandle } from '../store/sceneHandle';
import { collectBadgeLabel } from './collectBadgeLabel';
import { useGame } from './hooks';

const INDICATOR_HEIGHT = 1.8;
const BESIDE_BADGE_PX = 44;

export function WorkingIndicators() {
  const buildings = useGame((store) => store.state.buildings);
  const working = useMemo(() => buildings.filter(isWorking), [buildings]);
  const elements = useRef(new Map<number, HTMLSpanElement>());

  useEffect(() => {
    let handle = 0;
    const place = () => {
      for (const building of working) {
        const element = elements.current.get(building.id);
        const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
        const projected = sceneHandle.current?.project(building.x + width / 2, INDICATOR_HEIGHT, building.y + depth / 2);
        if (!element || !projected) continue;
        const beside = collectBadgeLabel(building) !== null ? BESIDE_BADGE_PX : 0;
        element.style.transform = `translate(${projected.x + beside}px, ${projected.y}px) translate(-50%, -100%)`;
        element.style.visibility = projected.visible ? 'visible' : 'hidden';
      }
      handle = requestAnimationFrame(place);
    };
    handle = requestAnimationFrame(place);
    return () => cancelAnimationFrame(handle);
  }, [working]);

  return (
    <>
      {working.map((building) => (
        <span
          key={building.id}
          ref={(element) => {
            if (element) elements.current.set(building.id, element);
            else elements.current.delete(building.id);
          }}
          className="working-indicator"
          aria-hidden="true"
        >
          <span className="working-gear">⚙</span>
        </span>
      ))}
    </>
  );
}
