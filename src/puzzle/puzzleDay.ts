const PARIS = 'Europe/Paris';
const RESET_HOUR = 7;

// The Daily puzzles change at 07:00 Paris time, like the Daily challenges: the day of a moment is the date in Paris seven hours earlier.
// A stand-in until the server publishes the seed of the day.
export function puzzleDay(now: number): string {
  return new Date(now - RESET_HOUR * 3_600_000).toLocaleDateString('en-CA', { timeZone: PARIS });
}

export const puzzleSeedOf = (day: string): string => `daily-puzzle-${day}`;
