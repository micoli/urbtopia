import { formatDuration } from '../common/formatDuration';

export function formatSolidarityDuration(milliseconds: number): string {
  const formatted = formatDuration(milliseconds);
  return formatted.split(':').length === 3 ? formatted : `0:${formatted}`;
}
