export const PREVIEW_SIZE = 32;
export const BADGE_SIZE = 40;
const BADGE_PADDING = 3;
const OVERLAP = 0.6;

export interface Offset {
  x: number;
  y: number;
}

// Icons shrink as they multiply so the badge keeps the size of a classic one:
// neighbours stay OVERLAP of an icon apart on a ring that fits inside the badge.
export function radialIconSize(count: number): number {
  if (count <= 1) return PREVIEW_SIZE;
  const inner = BADGE_SIZE - 2 * BADGE_PADDING;
  const spread = Math.sin(Math.PI / count);
  return Math.min(PREVIEW_SIZE, (inner * spread) / (OVERLAP + spread));
}

export function radialRadius(count: number): number {
  if (count <= 1) return 0;
  return (BADGE_SIZE - 2 * BADGE_PADDING - radialIconSize(count)) / 2;
}

export function radialOffsets(count: number): Offset[] {
  const radius = radialRadius(count);
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
}
