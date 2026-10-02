import { useEffect, useRef } from 'react';
import { footprintOf, type Building } from '../core';
import { gameStore } from '../store/gameStore';
import { sceneHandle } from '../store/sceneHandle';

const BADGE_HEIGHT = 1.8;

interface CollectBadgeProps {
  building: Building;
  readyCount: number;
}

export function CollectBadge({ building, readyCount }: CollectBadgeProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const { width, depth } = footprintOf(building.type, building.rotation);
    let handle = 0;
    const place = () => {
      const element = ref.current;
      const projected = sceneHandle.current?.project(building.x + width / 2, BADGE_HEIGHT, building.y + depth / 2);
      if (element && projected) {
        element.style.transform = `translate(${projected.x}px, ${projected.y}px) translate(-50%, -100%)`;
        element.style.visibility = projected.visible ? 'visible' : 'hidden';
      }
      handle = requestAnimationFrame(place);
    };
    handle = requestAnimationFrame(place);
    return () => cancelAnimationFrame(handle);
  }, [building.x, building.y, building.type, building.rotation]);

  return (
    <button
      ref={ref}
      type="button"
      className="collect-badge"
      onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}
    >
      ✓ {readyCount}
    </button>
  );
}
