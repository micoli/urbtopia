import { useEffect } from 'react';
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

  if (!unlocked) return null;
  return (
    <div className="level-selector" role="group" aria-label={t('level.selector')}>
      {LEVELS.filter(candidate => candidate !== -2 || metroUnlocked).map(candidate => (
        <IconButton
          key={candidate}
          size="md"
          tone={candidate === level ? 'accent' : 'light'}
          label={t(LEVEL_NAMES[candidate])}
          aria-pressed={candidate === level}
          onClick={() => setLevel(candidate)}
        >
          {LEVEL_LABELS[candidate]}
        </IconButton>
      ))}
      <FirstUseHint id="levels">{t('hint.levels')}</FirstUseHint>
    </div>
  );
}
