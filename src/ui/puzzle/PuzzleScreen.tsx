import { puzzleViewRatio } from '../../scene/puzzle/PuzzleBoardScene';
import type { CSSProperties } from 'react';
import { puzzleStore } from '../../store/puzzleStore';
import type { Puzzle } from '../../core/dailyPuzzle/types';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';
import { Dialog } from '../common/Dialog';
import { PuzzleActions } from './PuzzleActions';
import { PuzzleAims } from './PuzzleAims';
import { PuzzleCanvas } from './PuzzleCanvas';
import { PuzzleDragLayer } from './PuzzleDragLayer';
import { PuzzleRunButton } from './PuzzleRunButton';
import { PuzzleTray } from './PuzzleTray';
import { PuzzleVerdict } from './PuzzleVerdict';
import { usePuzzleGame } from './usePuzzleGame';

interface PuzzleScreenProps {
  puzzle: Puzzle;
}

export function PuzzleScreen({ puzzle }: PuzzleScreenProps) {
  const view = usePuzzleGame(puzzle);
  return (
    <Dialog className="puzzle-backdrop">
      <Dialog.Title>{t('puzzle.title')}</Dialog.Title>
      <Dialog.Body>
        <div className="puzzle-screen">
          <div className="puzzle-close"><CloseButton label={t('puzzle.close')} onClick={() => puzzleStore.getState().close()} /></div>
          <PuzzleAims aims={puzzle.board.aims} />
          <PuzzleTray view={view} />
          <div className="puzzle-stage" style={{ '--puzzle-ratio': puzzleViewRatio(puzzle.board.width, puzzle.board.height) } as CSSProperties}><PuzzleCanvas view={view} /><PuzzleRunButton view={view} />{view.phase === 'done' ? <PuzzleVerdict solved={view.solved} /> : null}</div>
          <PuzzleActions view={view} />
          <PuzzleDragLayer />
        </div>
      </Dialog.Body>
    </Dialog>
  );
}
