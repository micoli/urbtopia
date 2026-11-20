import type { CSSProperties, ReactNode } from 'react';
import { GRID, type Edge } from './model.ts';

const tracks = `${Array.from({ length: GRID }, () => '14px 40px').join(' ')} 14px`;

export const cellPlacement = (c: number, r: number): CSSProperties => ({ gridColumn: 2 * c + 2, gridRow: 2 * r + 2 });

export function edgePlacement(edge: Edge): CSSProperties {
  const column = 2 * edge.c + 2 + (edge.dir === 1 ? 1 : edge.dir === 3 ? -1 : 0);
  const row = 2 * edge.r + 2 + (edge.dir === 2 ? 1 : edge.dir === 0 ? -1 : 0);
  return { gridColumn: column, gridRow: row };
}

export function PlanGrid({ children }: { children: ReactNode }) {
  return (
    <div className="plan" style={{ gridTemplateColumns: tracks, gridTemplateRows: tracks }}>
      {children}
    </div>
  );
}
