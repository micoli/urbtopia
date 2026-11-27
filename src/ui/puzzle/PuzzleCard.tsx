import type { Difficulty } from '../../core/dailyPuzzle/types';
import { puzzleDay, puzzleSeedOf } from '../../puzzle/puzzleDay';
import { t } from '../../i18n/t';
import { puzzleStore } from '../../store/puzzleStore';
import { ActionButton } from '../common/ActionButton';

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];

// The Daily puzzle, at the head of the Events tab: one button for each difficulty.
export function PuzzleCard() {
  const open = (difficulty: Difficulty) => puzzleStore.getState().open(puzzleSeedOf(puzzleDay(Date.now())), difficulty);
  return (
    <section className="puzzle-card" aria-label={t('puzzle.card.title')}>
      <strong>{t('puzzle.card.title')}</strong>
      <p className="puzzle-card__text">{t('puzzle.card.text')}</p>
      <div className="puzzle-card__levels">
        {LEVELS.map((level) => <ActionButton key={level} variant="primary" onClick={() => open(level)}>{t(`puzzle.difficulty.${level}`)}</ActionButton>)}
      </div>
    </section>
  );
}
