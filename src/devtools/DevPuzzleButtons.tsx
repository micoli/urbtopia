import { useState } from 'react';
import type { Difficulty } from '../core/dailyPuzzle/types';
import { puzzleDay, puzzleSeedOf } from '../puzzle/puzzleDay';
import { puzzleStore } from '../store/puzzleStore';
import { ActionButton } from '../ui/common/ActionButton';
import { ButtonRow } from '../ui/common/ButtonRow';

interface DevPuzzleButtonsProps {
  onDone: () => void;
}

const LEVELS: { level: Difficulty; label: string }[] = [
  { level: 'easy', label: 'Facile' },
  { level: 'medium', label: 'Moyen' },
  { level: 'hard', label: 'Difficile' },
];

// The Market, where the Daily puzzle lives, stays locked until goods are produced: this opens the puzzle straight away, on the seed of the day or on a seed of your own.
// The puzzle screen is modal and would leave the dev tools out of reach, so they close first.
export function DevPuzzleButtons({ onDone }: DevPuzzleButtonsProps) {
  const [seed, setSeed] = useState(() => puzzleSeedOf(puzzleDay(Date.now())));
  const open = (level: Difficulty) => {
    puzzleStore.getState().open(seed.trim() === '' ? puzzleSeedOf(puzzleDay(Date.now())) : seed.trim(), level);
    onDone();
  };
  return (
    <>
      <label htmlFor="devtools-puzzle-seed">Graine du puzzle</label>
      <input id="devtools-puzzle-seed" type="text" value={seed} onChange={(event) => setSeed(event.target.value)} />
      <ButtonRow align="stretch" spaced>
        {LEVELS.map(({ level, label }) => <ActionButton key={level} variant="primary" onClick={() => open(level)}>{label}</ActionButton>)}
      </ButtonRow>
      <small>Ouvre le puzzle du jour sans passer par le Marché. La graine par défaut est celle du jour.</small>
    </>
  );
}
