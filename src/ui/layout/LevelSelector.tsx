import { useEffect, useState } from 'react';
import { LEVELS, levelUnlocked, undergroundUnlocked, type Level } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { FirstUseHint } from '../common/FirstUseHint';
import { IconButton } from '../common/IconButton';
import { useGame, useUi } from '../common/hooks';
import { uiStore } from '../../store/uiStore';
import { isTypingTarget, levelStepOfKey } from './levelKeys';

const LEVEL_NAMES: Record<Level, MessageKey> = {
  0: 'level.surface',
  '-1': 'level.minus1',
  '-2': 'level.minus2',
};

const LEVEL_LABELS: Record<Level, string> = { 0: '0', '-1': '-1', '-2': '-2' };

export function LevelSelector() {
  const unlocked = useGame(store => undergroundUnlocked(store.state));
  const metroUnlocked = useGame(store => levelUnlocked(store.state, -2));
  const level = useUi(store => store.level);
  const setLevel = useUi(store => store.setLevel);
  const analytics = useUi(store => store.analyticsLayer !== null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const step = levelStepOfKey(event);
      if (step === null || isTypingTarget(event.target)) return;
      uiStore.getState().stepLevel(step);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [unlocked]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !(event.target as Element | null)?.closest('.level-selector')) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  if (!unlocked || analytics) return null;
  const levels = LEVELS.filter(candidate => candidate !== -2 || metroUnlocked);
  const choose = (candidate: Level) => {
    setLevel(candidate);
    setOpen(false);
  };
  // Closed, the selector is one button showing the Level; open, it lists the Levels to pick from.
  return (
    <div className="level-selector" role="group" aria-label={t('level.selector')}>
      {open ? levels.map(candidate => (
        <IconButton
          key={candidate}
          size="md"
          tone={candidate === level ? 'accent' : 'light'}
          label={t(LEVEL_NAMES[candidate])}
          aria-pressed={candidate === level}
          onClick={() => choose(candidate)}
        >
          {LEVEL_LABELS[candidate]}
        </IconButton>
      )) : (
        <IconButton size="md" tone={level === 0 ? 'light' : 'accent'} label={t('level.change')} aria-expanded={false} onClick={() => setOpen(true)}>
          {LEVEL_LABELS[level]}
        </IconButton>
      )}
      <FirstUseHint id="levels">{t('hint.levels')}</FirstUseHint>
    </div>
  );
}
