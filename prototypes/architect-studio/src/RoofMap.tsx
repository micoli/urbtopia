import { GRID, rectAt, roofRects, type Plan } from './model.ts';
import { SECTION_COLORS } from './editorConstants.ts';
import { PlanGrid, cellPlacement } from './PlanGrid.tsx';

interface RoofMapProps {
  plan: Plan;
  roofKey?: string;
  onSelect: (key: string) => void;
}

// Every column seen from above, coloured by roof section.
export function RoofMap({ plan, roofKey, onSelect }: RoofMapProps) {
  const sections = roofRects(plan);
  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const rect = rectAt(plan, c, r);
      const classes = ['cell', rect ? 'on' : 'off', rect?.key === roofKey ? 'picked' : ''].filter(Boolean).join(' ');
      cells.push(
        <button
          key={`${c}:${r}`}
          className={classes}
          style={{ ...cellPlacement(c, r), background: rect ? SECTION_COLORS[sections.findIndex((s) => s.key === rect.key) % SECTION_COLORS.length] : undefined }}
          disabled={!rect}
          onClick={() => rect && onSelect(rect.key)}
        >
          {rect ? rect.floor + 1 : ''}
        </button>,
      );
    }
  }
  return <PlanGrid>{cells}</PlanGrid>;
}
