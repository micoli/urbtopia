import { GRID, canToggle, exteriorEdges, getBrick, isOccupied, type Brick, type Edge, type Plan } from './model.ts';
import { BRICK_COLOR, type Mode } from './editorConstants.ts';
import { PlanGrid, cellPlacement } from './PlanGrid.tsx';
import { SlotButton } from './SlotButton.tsx';

export const sameEdge = (a: Edge, b: Edge) => a.floor === b.floor && a.c === b.c && a.r === b.r && a.dir === b.dir;

interface FloorPlanProps {
  plan: Plan;
  floor: number;
  mode: Mode;
  selected?: Edge;
  onToggleCell: (c: number, r: number) => void;
  onPickSlot: (edge: Edge) => void;
  onHover: (edge: Edge | undefined) => void;
}

// Cells of the selected floor (editable in footprint mode) with the exterior edges around them (facade mode).
export function FloorPlan({ plan, floor, mode, selected, onToggleCell, onPickSlot, onHover }: FloorPlanProps) {
  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const on = isOccupied(plan, floor, c, r);
      const supported = floor === 0 || isOccupied(plan, floor - 1, c, r);
      cells.push(
        <button
          key={`${c}:${r}`}
          className={on ? 'studio-cell on' : supported ? 'studio-cell free' : 'studio-cell off'}
          style={cellPlacement(c, r)}
          disabled={mode !== 'footprint' || !canToggle(plan, floor, c, r)}
          onClick={() => onToggleCell(c, r)}
        />,
      );
    }
  }
  const slots =
    mode === 'facade'
      ? exteriorEdges(plan)
          .filter((edge) => edge.floor === floor)
          .map((edge) => {
            const brick: Brick = getBrick(plan, edge);
            return (
              <SlotButton
                key={`${edge.c}:${edge.r}:${edge.dir}`}
                edge={edge}
                color={BRICK_COLOR[brick]}
                picked={!!selected && sameEdge(edge, selected)}
                onPick={() => onPickSlot(edge)}
                onHover={onHover}
              />
            );
          })
      : [];
  return (
    <PlanGrid>
      {cells}
      {slots}
    </PlanGrid>
  );
}
