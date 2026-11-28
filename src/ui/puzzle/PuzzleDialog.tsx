import { useStore } from 'zustand';
import { puzzleStore } from '../../store/puzzleStore';
import { PuzzleScreen } from './PuzzleScreen';

export function PuzzleDialog() {
  const puzzle = useStore(puzzleStore, (store) => store.puzzle);
  return puzzle ? <PuzzleScreen puzzle={puzzle} /> : null;
}
