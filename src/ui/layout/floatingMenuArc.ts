export interface ArcOffset {
  x: number;
  y: number;
}

const MAX_SPAN_DEGREES = 160;
const MAX_STEP_DEGREES = 45;
const MIN_RADIUS = 72;
const MIN_CHORD = 58;
const RAISE = 28;

// Where each button of a floating menu sits on an arc opening downwards, in pixels from its centre: straight down is the middle of
// the arc, lifted a little so that its middle stays close to the selection. The radius grows with the number of buttons so that neighbours keep a comfortable gap.
export function floatingMenuArc(count: number): ArcOffset[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 0, y: MIN_RADIUS - RAISE }];
  const step = Math.min(MAX_STEP_DEGREES, MAX_SPAN_DEGREES / (count - 1)) * Math.PI / 180;
  const radius = Math.max(MIN_RADIUS, MIN_CHORD / (2 * Math.sin(step / 2)));
  return Array.from({ length: count }, (_, index) => {
    const angle = (index - (count - 1) / 2) * step;
    return { x: Math.round(radius * Math.sin(angle)), y: Math.round(radius * Math.cos(angle) - RAISE) };
  });
}
