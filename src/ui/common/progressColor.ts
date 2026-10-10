const ORANGE_HUE = 30;
const GREEN_HUE = 130;

// Red at 0, orange at 0.5, green at 1.
export function progressColor(progress: number, alpha = 0.3): string {
  const clamped = Math.min(1, Math.max(0, progress));
  const hue = clamped < 0.5 ? ORANGE_HUE * (clamped / 0.5) : ORANGE_HUE + (GREEN_HUE - ORANGE_HUE) * ((clamped - 0.5) / 0.5);
  return `hsl(${Math.round(hue)} 80% 50% / ${alpha})`;
}
