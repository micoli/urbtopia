import { useRef } from 'react';
import { t } from './i18n.ts';
import { DIR_NAMES } from './labels.ts';
import type { Edge } from './model.ts';
import { edgePlacement } from './PlanGrid.tsx';

interface SlotButtonProps {
  edge: Edge;
  color: string;
  picked?: boolean;
  marked?: boolean;
  onPick: () => void;
  onHover: (edge: Edge | undefined) => void;
}

// With a mouse the ghost follows the pointer; with a finger there is no hover, so the ghost stays on the slot last touched.
export function SlotButton({ edge, color, picked, marked, onPick, onHover }: SlotButtonProps) {
  const pointer = useRef('mouse');
  const orientation = edge.dir % 2 === 0 ? 'h' : 'v';
  return (
    <button
      className={`studio-slot ${orientation}${picked ? ' picked' : ''}${marked ? ' has-dormer' : ''}`}
      title={`${DIR_NAMES[edge.dir]} · ${t('architect.floor')} ${edge.floor}`}
      style={{ ...edgePlacement(edge), background: color }}
      onPointerDown={(event) => { pointer.current = event.pointerType; }}
      onClick={() => {
        onPick();
        if (pointer.current !== 'mouse') onHover(edge);
      }}
      onPointerEnter={(event) => event.pointerType === 'mouse' && onHover(edge)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && onHover(undefined)}
    />
  );
}
