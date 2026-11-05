import { useEffect, useState } from 'react';
import { LEVELS, levelUnlocked, undergroundUnlocked, type Level } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { FirstUseHint } from '../common/FirstUseHint';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { useGame, useUi } from '../common/hooks';
import { uiStore } from '../../store/uiStore';
import { isTypingTarget, levelStepOfKey } from './levelKeys';

const LEVEL_NAMES: Record<Level, MessageKey> = {
  0: 'level.surface',
  '-1': 'level.minus1',
  '-2': 'level.minus2',
};

const LEVEL_SHORT_NAMES: Record<Level, MessageKey> = {
  0: 'level.short.surface',
  '-1': 'level.short.pedestrian',
  '-2': 'level.short.metro',
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
  // The button always shows the current Level; open, the other Levels to pick from appear above it.
  const others = levels.filter(candidate => candidate !== level);
  return (
    <div className="level-selector" role="group" aria-label={t('level.selector')}>
      {open ? others.map(candidate => (
        <IconButton key={candidate} size="md" tone="light" className="level-selector__option" label={t(LEVEL_NAMES[candidate])} onClick={() => choose(candidate)}>
          <span>{LEVEL_LABELS[candidate]}</span>
          <small className="level-selector__name">{t(LEVEL_SHORT_NAMES[candidate])}</small>
        </IconButton>
      )) : null}
      <IconButton size="md" tone={level === 0 ? 'light' : 'accent'} label={t('level.change')} aria-expanded={open} className="level-selector__button" onClick={() => setOpen(!open)}>
        <span>{LEVEL_LABELS[level]}</span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} />
      </IconButton>
      <FirstUseHint id="levels">{t('hint.levels')}</FirstUseHint>
    </div>
  );
}
