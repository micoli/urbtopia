import { useEffect, useRef } from 'react';
import type { Plan } from './model.ts';
import { Viewer, type PickHit, type SlotRef } from './render.ts';

interface PlanViewerProps {
  plan: Plan;
  ghost?: SlotRef;
  selectedRoof?: string;
  onPick: (hit: PickHit) => void;
}

export function PlanViewer({ plan, ghost, selectedRoof, onPick }: PlanViewerProps) {
  const container = useRef<HTMLElement>(null);
  const viewer = useRef<Viewer | null>(null);

  useEffect(() => {
    const created = new Viewer(container.current!);
    viewer.current = created;
    return () => {
      created.destroy();
      viewer.current = null;
    };
  }, []);

  useEffect(() => {
    if (viewer.current) viewer.current.onPick = onPick;
  }, [onPick]);

  useEffect(() => {
    viewer.current?.setPlan(plan, ghost, selectedRoof);
  }, [plan, ghost, selectedRoof]);

  return <main id="view" ref={container} />;
}
