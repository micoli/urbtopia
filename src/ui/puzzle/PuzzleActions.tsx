import { isDevelopmentHost } from '../../devtools/isDevelopmentHost';
import { t } from '../../i18n/t';
import { puzzleStore } from '../../store/puzzleStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import type { PuzzleView } from './usePuzzleGame';

interface PuzzleActionsProps {
  view: PuzzleView;
}

// Icons only: the name of each button is its label for a screen reader and its tooltip.
export function PuzzleActions({ view }: PuzzleActionsProps) {
  const editing = view.phase === 'edit';
  const store = puzzleStore.getState();
  return (
    <div className="puzzle-actions">
      <IconButton size="md" tone="light" label={t('puzzle.undo')} title={t('puzzle.undo')} disabled={!editing || !view.canUndo} onClick={() => store.undo()}><Icon name="undo" /></IconButton>
      <IconButton size="md" tone="light" label={t('puzzle.clear')} title={t('puzzle.clear')} disabled={!editing || view.parts.length === 0} onClick={() => store.clear()}><Icon name="trash" /></IconButton>
      {import.meta.env.DEV && isDevelopmentHost(window.location.hostname) ? <ActionButton size="sm" variant="info" disabled={!editing} onClick={() => store.solveForDev()}>Solve</ActionButton> : null}
      {view.phase === 'edit' ? <IconButton size="md" tone="accent" label={t('puzzle.run')} title={t('puzzle.run')} onClick={() => store.run()}><Icon name="play" /></IconButton> : null}
      {view.phase === 'run' ? <IconButton size="md" tone="danger" label={t('puzzle.stop')} title={t('puzzle.stop')} onClick={() => store.reset()}><Icon name="stop" /></IconButton> : null}
      {view.phase === 'done' ? <IconButton size="md" tone="accent" label={t('puzzle.reset')} title={t('puzzle.reset')} onClick={() => store.reset()}><Icon name="rotateLeft" /></IconButton> : null}
    </div>
  );
}
