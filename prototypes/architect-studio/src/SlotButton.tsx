import { DIR_NAMES, type Edge } from './model.ts';
import { edgePlacement } from './PlanGrid.tsx';

interface SlotButtonProps {
  edge: Edge;
  label: string;
  color: string;
  picked?: boolean;
  onPick: () => void;
  onHover: (edge: Edge | undefined) => void;
}

export function SlotButton({ edge, label, color, picked, onPick, onHover }: SlotButtonProps) {
  const orientation = edge.dir % 2 === 0 ? 'h' : 'v';
  return (
    <button
      className={`slot ${orientation}${picked ? ' picked' : ''}`}
      title={`${DIR_NAMES[edge.dir]} · étage ${edge.floor}`}
      style={{ ...edgePlacement(edge), background: color }}
      onClick={onPick}
      onMouseEnter={() => onHover(edge)}
      onMouseLeave={() => onHover(undefined)}
    >
      {label}
    </button>
  );
}
