import { useEffect, useRef, type ReactNode } from 'react';
import type { Plan } from './model.ts';
import { Viewer, type PickHit, type SlotRef } from './render.ts';

interface PlanViewerProps {
  plan: Plan;
  ghost?: SlotRef;
  selectedRoof?: string;
  onPick: (hit: PickHit) => void;
  children?: ReactNode;
}

export function PlanViewer({ plan, ghost, selectedRoof, onPick, children }: PlanViewerProps) {
  const container = useRef<HTMLDivElement>(null);
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

  return (
    <main className="studio-view">
      <div className="studio-canvas" ref={container} />
      {children}
    </main>
  );
}
