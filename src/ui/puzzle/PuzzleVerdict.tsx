import { t } from '../../i18n/t';
import { puzzleStore } from '../../store/puzzleStore';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';

interface PuzzleVerdictProps {
  solved: boolean;
}

// What a run came to, in the middle of the board, with the button to go back to the start. It stays until the player does.
export function PuzzleVerdict({ solved }: PuzzleVerdictProps) {
  return (
    <div className={solved ? 'puzzle-hint puzzle-hint--solved' : 'puzzle-hint puzzle-hint--failed'}>
      <p className="puzzle-hint__text" role="status">{solved ? t('puzzle.solved') : t('puzzle.failed')}</p>
      <IconButton size="md" tone="accent" label={t('puzzle.reset')} title={t('puzzle.reset')} onClick={() => puzzleStore.getState().reset()}><Icon name="rotateLeft" /></IconButton>
    </div>
  );
}
