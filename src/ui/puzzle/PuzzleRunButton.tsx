import { t } from '../../i18n/t';
import { puzzleStore } from '../../store/puzzleStore';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import type { PuzzleView } from './usePuzzleGame';

interface PuzzleRunButtonProps {
  view: PuzzleView;
}

// The one button of a run, at the top of the board: it starts the run and stops it. Once the run is over the verdict carries the way back.
export function PuzzleRunButton({ view }: PuzzleRunButtonProps) {
  const store = puzzleStore.getState();
  return (
    <div className="puzzle-run">
      {view.phase === 'edit' ? <IconButton size="md" tone="accent" label={t('puzzle.run')} title={t('puzzle.run')} onClick={() => store.run()}><Icon name="play" /></IconButton> : null}
      {view.phase === 'run' ? <IconButton size="md" tone="danger" label={t('puzzle.stop')} title={t('puzzle.stop')} onClick={() => store.reset()}><Icon name="stop" /></IconButton> : null}
    </div>
  );
}
