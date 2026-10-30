// A long wait as a player reads it: 2 h 05, 42 min, then the last minute.
export function formatTimeLeft(milliseconds: number): string {
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${String(rest).padStart(2, '0')}`;
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const two = (value: number) => String(value).padStart(2, '0');
  if (hours > 0) return `${hours}:${two(minutes)}:${two(seconds)}`;
  return `${minutes}:${two(seconds)}`;
}
