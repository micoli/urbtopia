import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { clampToViewport } from '../layout/clampToViewport';
import { ButtonRow } from '../common/ButtonRow';
import { InlineConfirm } from '../common/InlineConfirm';
import { TutorialText } from './TutorialText';

interface Position {
  x: number;
  y: number;
}

interface TutorialBannerFrameProps {
  title: string;
  counter: string;
  text: string;
  skipLabel: string;
  skipConfirmLabel: string;
  onSkip: () => void;
  actions?: ReactNode;
}

export function TutorialBannerFrame({ title, counter, text, skipLabel, skipConfirmLabel, onSkip, actions }: TutorialBannerFrameProps) {
  const [confirming, setConfirming] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const banner = useRef<HTMLElement>(null);
  const grab = useRef<Position | null>(null);

  const skip = () => {
    setConfirming(false);
    onSkip();
  };

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    const rect = banner.current?.getBoundingClientRect();
    if (!rect) return;
    grab.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<HTMLElement>) => {
    const rect = banner.current?.getBoundingClientRect();
    if (!grab.current || !rect) return;
    const target = { x: event.clientX - grab.current.x, y: event.clientY - grab.current.y };
    setPosition(clampToViewport(target, rect, { width: window.innerWidth, height: window.innerHeight }));
  };

  const endDrag = () => {
    grab.current = null;
  };

  return (
    <aside ref={banner} className="tutorial-banner" style={position ? { left: position.x, top: position.y, transform: 'none' } : undefined}>
      <header className="tutorial-handle" onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <strong>{title}</strong>
        <span>{counter}</span>
      </header>
      <p>
        <TutorialText text={text} />
      </p>
      <ButtonRow align="start">
        {actions}
        <InlineConfirm
          confirming={confirming}
          triggerLabel={skipLabel}
          confirmLabel={skipConfirmLabel}
          onRequest={() => setConfirming(true)}
          onCancel={() => setConfirming(false)}
          onConfirm={skip}
        />
      </ButtonRow>
    </aside>
  );
}
