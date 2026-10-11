import { useMemo, useRef } from 'react';
import { footprintOf, isWorking, workProgress } from '../../core';
import { sceneHandle } from '../../store/sceneHandle.ts';
import { collectBadgeLabel } from '../collect/CollectBadge.tsx';
import { useGame } from './hooks.ts';
import { WorkWheel } from './WorkWheel.tsx';
import { placeProjected, useFrameLoop } from './useProjectedPosition.ts';

const ROOF_CLEARANCE = 0.1;
const RING_RADIUS = 14;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const BELOW_BADGE_HEIGHT = 0.9;

export function WorkingIndicators() {
  const buildings = useGame((store) => store.state.buildings);
  const now = useGame((store) => store.state.lastSeen);
  const working = useMemo(() => buildings.filter(isWorking), [buildings]);
  const elements = useRef(new Map<number, HTMLSpanElement>());

  useFrameLoop(() => {
    for (const building of working) {
      const element = elements.current.get(building.id);
      const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
      const scene = sceneHandle.current;
      if (!element || !scene) continue;
      const aboveRoof = scene.buildingHeight(building) + ROOF_CLEARANCE;
      const height = collectBadgeLabel(building) !== null ? Math.min(aboveRoof, BELOW_BADGE_HEIGHT) : aboveRoof;
      const projected = scene.project(building.x + width / 2, height, building.y + depth / 2);
      placeProjected(element, projected, 'above');
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
          {building.queue.length > 0 ? (
            <WorkWheel queue={building.queue} now={now} />
          ) : (
            <>
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
            </>
          )}
        </span>
      ))}
    </>
  );
}
