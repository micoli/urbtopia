import { GRID, canToggle, decorAllowed, exteriorEdges, getBrick, getDecor, isOccupied, type Brick, type Decor, type Edge, type Plan } from '../core/architect/housePlan.ts';
import { BRICK_COLOR, DECOR_COLOR, type Mode } from './editorConstants.ts';
import { PlanGrid, cellPlacement } from './PlanGrid.tsx';
import { SlotButton } from './SlotButton.tsx';

export const sameEdge = (a: Edge, b: Edge) => a.floor === b.floor && a.c === b.c && a.r === b.r && a.dir === b.dir;

interface FloorPlanProps {
  plan: Plan;
  floor: number;
  mode: Mode;
  selected?: Edge;
  decorTool?: Decor;
  onToggleCell: (c: number, r: number) => void;
  onPickSlot: (edge: Edge) => void;
  onSelectSlot: (edge: Edge) => void;
  onHover: (edge: Edge | undefined) => void;
}

// Cells of the selected floor (editable in footprint mode) with the exterior edges around them (facade mode).
export function FloorPlan({ plan, floor, mode, selected, decorTool, onToggleCell, onPickSlot, onSelectSlot, onHover }: FloorPlanProps) {
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
                marked={!!getDecor(plan, edge)}
                dimmed={!!decorTool}
                onPick={() => (decorTool ? onSelectSlot(edge) : onPickSlot(edge))}
                onHover={onHover}
              />
            );
          })
      : [];
  // A decor stands in front of an opening: its slots form a second ring outside the one of the bricks.
  const decorSlots =
    mode === 'facade' && decorTool
      ? exteriorEdges(plan)
          .filter((edge) => edge.floor === floor)
          .map((edge) => {
            const current = getDecor(plan, edge);
            return (
              <SlotButton
                key={`decor:${edge.c}:${edge.r}:${edge.dir}`}
                edge={edge}
                outside
                color={current ? DECOR_COLOR[current] : 'var(--white-a35)'}
                marked={!!current}
                disabled={!decorAllowed(plan, edge, decorTool)}
                picked={!!selected && sameEdge(edge, selected)}
                onPick={() => onPickSlot(edge)}
                onHover={onHover}
              />
            );
          })
      : [];
  return (
    <PlanGrid decors={!!decorTool}>
      {cells}
      {slots}
      {decorSlots}
    </PlanGrid>
  );
}
