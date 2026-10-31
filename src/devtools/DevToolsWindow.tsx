import { useRef, type ReactNode } from 'react';
import { useDevToolsPosition } from './useDevToolsPosition';

interface DevToolsWindowProps {
  onClose: () => void;
  children: ReactNode;
}

export function DevToolsWindow({ onClose, children }: DevToolsWindowProps) {
  const panel = useRef<HTMLElement>(null);
  const { position, handleProps } = useDevToolsPosition(panel);
  return (
    <section ref={panel} id="devtools-panel" className="devtools-panel" aria-labelledby="devtools-title" style={position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto', maxHeight: `calc(100dvh - ${position.y}px - 12px)` } : undefined}>
      <header className="devtools-handle" {...handleProps}>
        <strong id="devtools-title">Outils de développement</strong>
        <button type="button" className="devtools-close" aria-label="Fermer les outils de développement" onPointerDown={(event) => event.stopPropagation()} onClick={onClose}>×</button>
      </header>
      <div className="devtools-body">{children}</div>
    </section>
  );
}
