interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

export function clampToViewport(position: Point, size: Size, viewport: Size): Point {
  const maxX = Math.max(0, viewport.width - size.width);
  const maxY = Math.max(0, viewport.height - size.height);
  return { x: Math.min(maxX, Math.max(0, position.x)), y: Math.min(maxY, Math.max(0, position.y)) };
}
