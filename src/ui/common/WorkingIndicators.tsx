import { useMemo, useRef } from 'react';
import { footprintOf, isWorking, workProgress } from '../../core';
import { sceneHandle } from '../../store/sceneHandle.ts';
import { collectBadgeLabel } from '../collect/CollectBadge.tsx';
import { useGame } from './hooks.ts';
import { placeProjected, useFrameLoop } from './useProjectedPosition.ts';

const INDICATOR_HEIGHT = 1.8;
const RING_RADIUS = 14;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const BESIDE_BADGE_PX = 44;

export function WorkingIndicators() {
  const buildings = useGame((store) => store.state.buildings);
  const now = useGame((store) => store.state.lastSeen);
  const working = useMemo(() => buildings.filter(isWorking), [buildings]);
  const elements = useRef(new Map<number, HTMLSpanElement>());

  useFrameLoop(() => {
    for (const building of working) {
      const element = elements.current.get(building.id);
      const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
      const projected = sceneHandle.current?.project(building.x + width / 2, INDICATOR_HEIGHT, building.y + depth / 2);
      if (!element || !projected) continue;
      const beside = collectBadgeLabel(building) !== null ? BESIDE_BADGE_PX : 0;
      placeProjected(element, projected, 'above', beside);
    }
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
          <svg className="working-ring" viewBox="0 0 32 32" aria-hidden="true">
            <circle className="working-ring-track" cx="16" cy="16" r={RING_RADIUS} />
            <circle
              className="working-ring-progress"
              cx="16"
              cy="16"
              r={RING_RADIUS}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - (workProgress(building, now) ?? 0))}
            />
          </svg>
          <span className="working-gear">⚙</span>
        </span>
      ))}
    </>
  );
}
