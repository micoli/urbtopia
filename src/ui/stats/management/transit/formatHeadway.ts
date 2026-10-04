export const formatHeadway = (minutes: number): string => (Number.isFinite(minutes) ? `${minutes.toFixed(1)} min` : '—');
