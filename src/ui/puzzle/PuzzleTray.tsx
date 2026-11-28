import { t } from '../../i18n/t';
import { dragJustEnded, puzzleStore } from '../../store/puzzleStore';
import { ActionButton } from '../common/ActionButton';
import { CountBadge } from '../common/CountBadge';
import { partLabel } from './partLabel';
import { PuzzlePartIcon } from './PuzzlePartIcon';
import type { PuzzleView } from './usePuzzleGame';

const pickUnlessDragged = (kind: string) => {
  if (!dragJustEnded()) puzzleStore.getState().pickKind(kind);
};

interface PuzzleTrayProps {
  view: PuzzleView;
}

// The Parts to use: one small picture per kind, with the copies left in a badge. A Part lifted from the board can be taken back from here.
export function PuzzleTray({ view }: PuzzleTrayProps) {
  const locked = view.phase !== 'edit';
  const holdingKind = view.held && 'kind' in view.held ? view.held.kind : undefined;
  const liftedPart = view.held !== null && 'cell' in view.held;
  return (
    <section className="puzzle-tray" aria-label={t('puzzle.tray')}>
      <ul className="puzzle-tray__list">
        {view.tray.map(({ kind, count }) => (
          <li key={kind}>
            <ActionButton size="sm" className="puzzle-tray__part" variant={holdingKind === kind ? 'primary' : 'default'} disabled={locked} aria-pressed={holdingKind === kind} onPointerDown={(event) => puzzleStore.getState().armDrag({ kind }, { x: event.clientX, y: event.clientY })} onClick={() => pickUnlessDragged(kind)} aria-label={`${partLabel(kind)} × ${count}`} title={partLabel(kind)}>
              <PuzzlePartIcon kind={kind} />
              <CountBadge floating count={count} label={partLabel(kind)} />
            </ActionButton>
          </li>
        ))}
      </ul>
      {liftedPart ? <ActionButton size="sm" variant="danger" disabled={locked} onClick={() => puzzleStore.getState().takeBack()}>{t('puzzle.takeBack')}</ActionButton> : null}
    </section>
  );
}
