const SUFFIXES = ['', 'K', 'M', 'B', 'T'];

export function formatCompactAmount(value: number): string {
  const whole = Math.floor(Math.max(0, value));
  if (whole < 1000) return String(whole);
  let tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(whole) / 3));
  let scaled = Math.floor((whole / 1000 ** tier) * 10) / 10;
  if (scaled >= 1000 && tier < SUFFIXES.length - 1) {
    tier++;
    scaled = Math.floor((whole / 1000 ** tier) * 10) / 10;
  }
  return `${scaled.toFixed(1)}${SUFFIXES[tier]}`;
}
