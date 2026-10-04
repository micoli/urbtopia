import { useEffect, useRef } from 'react';
import {Building, Command, taxDue} from '../../core';
import { gameStore } from '../../store/gameStore';
import { sceneHandle } from '../../store/sceneHandle';
import { registerCollector, startSweep } from './collectSweep';

const BADGE_HEIGHT = 1.8;

interface CollectBadgeProps {
  worldX: number;
  worldZ: number;
  label: string;
  command: Command;
}
export function collectBadgeLabel(building: Building): string | null {
  if (building.type === 'shop') {
    const earned = building.stacks.reduce((total, stack) => total + stack.earned, 0);
    return earned > 0 ? `+${earned}` : null;
  }
  if (building.type === 'home') {
    const due = taxDue(building);
    return due > 0 ? `+${due}` : null;
  }
  const ready = building.queue.filter((entry) => entry.done).length;
  return ready > 0 ? `✓ ${ready}` : null;
}

export function CollectBadge({ worldX, worldZ, label, command }: CollectBadgeProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let handle = 0;
    const place = () => {
      const element = ref.current;
      const projected = sceneHandle.current?.project(worldX, BADGE_HEIGHT, worldZ);
      if (element && projected) {
        element.style.transform = `translate(${projected.x}px, ${projected.y}px) translate(-50%, -100%)`;
        element.style.visibility = projected.visible ? 'visible' : 'hidden';
      }
      handle = requestAnimationFrame(place);
    };
    handle = requestAnimationFrame(place);
    return () => cancelAnimationFrame(handle);
  }, [worldX, worldZ]);

  const collect = () => gameStore.getState().send(command);

  useEffect(() => (ref.current ? registerCollector(ref.current, collect) : undefined));

  return (
    <button
      ref={ref}
      type="button"
      className="collect-badge"
      onPointerDown={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        startSweep();
        collect();
      }}
      onClick={(event) => {
        if (event.detail === 0) collect();
      }}
    >
      {label}
    </button>
  );
}
