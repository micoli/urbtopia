import { Children, isValidElement, type CSSProperties, type ReactNode } from 'react';
import { floatingMenuArc } from './floatingMenuArc';

interface FloatingMenuItemsProps {
  radial: boolean;
  children: ReactNode;
}

// The buttons of a floating menu, in a row or, with the radial setting, spread on an arc under the selection.
export function FloatingMenuItems({ radial, children }: FloatingMenuItemsProps) {
  const items = Children.toArray(children);
  if (!radial) return <>{items}</>;
  const arc = floatingMenuArc(items.length);
  return (
    <>
      {items.map((item, index) => (
        <span key={isValidElement(item) && item.key !== null ? item.key : index} className="floating-radial-item" style={{ '--arc-x': `${arc[index]!.x}px`, '--arc-y': `${arc[index]!.y}px` } as CSSProperties}>{item}</span>
      ))}
    </>
  );
}
