export const PREVIEW_SIZE = 32;
const OVERLAP = 0.6;

export interface Offset {
  x: number;
  y: number;
}

export function radialRadius(count: number): number {
  if (count <= 1) return 0;
  return (PREVIEW_SIZE / 2 / Math.sin(Math.PI / count)) * OVERLAP;
}

export function radialOffsets(count: number): Offset[] {
  const radius = radialRadius(count);
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
}

export function radialBadgeSize(count: number): number {
  return 2 * (radialRadius(count) + PREVIEW_SIZE / 2) + 6;
}
