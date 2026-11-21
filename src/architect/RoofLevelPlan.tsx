import { GRID, dormerAllowed, exteriorEdges, hasChimney, hasDormer, rectAt, roofRects, type Edge, type Plan } from '../core/architect/housePlan.ts';
import { SECTION_COLORS, type RoofTool } from './editorConstants.ts';
import { PlanGrid, cellPlacement } from './PlanGrid.tsx';
import { SlotButton } from './SlotButton.tsx';

interface RoofLevelPlanProps {
  plan: Plan;
  tool: RoofTool;
  onToggleChimney: (c: number, r: number) => void;
  onToggleDormer: (edge: Edge) => void;
  onHover: (edge: Edge | undefined) => void;
}

// Roof level of the facade mode: columns seen from above (chimneys) and the sides under a mansard (dormers).
export function RoofLevelPlan({ plan, tool, onToggleChimney, onToggleDormer, onHover }: RoofLevelPlanProps) {
  const sections = roofRects(plan);
  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const rect = rectAt(plan, c, r);
      cells.push(
        <button
          key={`${c}:${r}`}
          className={`studio-cell ${rect ? 'on' : 'off'}${rect && hasChimney(plan, c, r) ? ' has-chimney' : ''}`}
          style={{ ...cellPlacement(c, r), background: rect ? SECTION_COLORS[sections.findIndex((s) => s.key === rect.key) % SECTION_COLORS.length] : undefined }}
          disabled={!rect || tool !== 'chimney'}
          onClick={() => onToggleChimney(c, r)}
        />,
      );
    }
  }
  const slots = exteriorEdges(plan)
    .filter((edge) => (tool === 'dormer' || tool === 'roundDormer') && dormerAllowed(plan, edge))
    .map((edge) => {
      const on = hasDormer(plan, edge);
      return (
        <SlotButton
          key={`${edge.floor}:${edge.c}:${edge.r}:${edge.dir}`}
          edge={edge}
          color={on ? 'var(--color-accent)' : 'var(--white-a35)'}
          marked={on}
          onPick={() => onToggleDormer(edge)}
          onHover={onHover}
        />
      );
    });
  return (
    <PlanGrid>
      {cells}
      {slots}
    </PlanGrid>
  );
}
