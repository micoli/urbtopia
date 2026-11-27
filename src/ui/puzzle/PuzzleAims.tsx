import type { Aim } from '../../core/dailyPuzzle/types';
import { t } from '../../i18n/t';

interface PuzzleAimsProps {
  aims: Aim[];
}

export function PuzzleAims({ aims }: PuzzleAimsProps) {
  return (
    <ul className="puzzle-aims">
      {aims.map((aim) => <li key={aim.kind}>{t(`puzzle.aim.${aim.kind}`)}</li>)}
    </ul>
  );
}
