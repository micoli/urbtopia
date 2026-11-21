import type { ReactNode } from 'react';

interface ToolLeafProps {
  selected: boolean;
  disabled?: boolean;
  color?: string;
  children: ReactNode;
  onPick: () => void;
}

// One style of the tool tree: a swatch and its name, price and Tier.
export function ToolLeaf({ selected, disabled, color, children, onPick }: ToolLeafProps) {
  return (
    <button type="button" role="treeitem" aria-selected={selected} disabled={disabled} className="studio-tool" onClick={onPick}>
      {color && <i className="studio-swatch" style={{ background: color }} />}
      <span className="studio-tool__name">{children}</span>
    </button>
  );
}
