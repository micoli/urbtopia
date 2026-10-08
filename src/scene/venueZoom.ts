export const ZOOM = { min: 0.8, max: 3.5, sensitivity: 0.0015, maxStep: 0.25 };

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

// A turn of the wheel multiplies the zoom by a bounded factor: a notch of the mouse and a long swipe of a trackpad feel alike.
export function nextZoom(current: number, deltaY: number): number {
  const step = clamp(-deltaY * ZOOM.sensitivity, -ZOOM.maxStep, ZOOM.maxStep);
  return clamp(current * Math.exp(step), ZOOM.min, ZOOM.max);
}

// The view can only be moved away from the centre of the room as far as the zoom reveals something there.
export function maxPan(zoom: number, size: number): number {
  return Math.max(0, zoom - 1) * size * 0.5;
}

export function clampPan(pan: { x: number; z: number }, zoom: number, size: number): { x: number; z: number } {
  const limit = maxPan(zoom, size);
  return { x: clamp(pan.x, -limit, limit) + 0, z: clamp(pan.z, -limit, limit) + 0 };
}
