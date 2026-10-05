import { useRef, useState, type PointerEvent } from 'react';
import { TUTORIAL_STEPS, tutorialSkipMs } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { clampToViewport } from '../layout/clampToViewport';
import { useGame, useUi } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { InlineConfirm } from '../common/InlineConfirm';

interface Position {
  x: number;
  y: number;
}

export function TutorialBanner() {
  const state = useGame((store) => store.state);
  const settingsOpen = useUi(store => store.settingsOpen);
  const codexOpen = useUi(store => store.codexOpen);
  const [confirming, setConfirming] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const banner = useRef<HTMLElement>(null);
  const grab = useRef<Position | null>(null);
  const step = state.tutorial;
  if (step === null || settingsOpen || codexOpen) return null;

  const send = gameStore.getState().send;
  const canSkipTime = tutorialSkipMs(state, state.lastSeen) !== null;
  const skipTutorial = () => {
    setConfirming(false);
    send({ type: 'SkipTutorial' });
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
        <strong>{t('tutorial.title')}</strong>
        <span>
          {TUTORIAL_STEPS.indexOf(step) + 1}/{TUTORIAL_STEPS.length}
        </span>
      </header>
      <p>{t(`tutorial.${step}`)}</p>
      <ButtonRow align="start">
        {canSkipTime ? (
          <ActionButton variant="primary" onClick={() => send({ type: 'SkipTutorialStep' })}>
            {t('tutorial.timeSkip')}
          </ActionButton>
        ) : null}
        <InlineConfirm
          confirming={confirming}
          triggerLabel={t('tutorial.skip')}
          confirmLabel={t('tutorial.skipConfirm')}
          onRequest={() => setConfirming(true)}
          onCancel={() => setConfirming(false)}
          onConfirm={skipTutorial}
        />
      </ButtonRow>
    </aside>
  );
}
