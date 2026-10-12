export interface PanelSlot {
  x: number;
  z: number;
  scale: number;
}

// Panels laid out in a grid over a footprint, as offsets from its center; with no count, one panel per tile. Panels shrink once a cell is smaller than a tile.
export function solarPanelLayout(width: number, depth: number, count = width * depth): PanelSlot[] {
  const columns = Math.min(count, Math.max(1, Math.round(Math.sqrt((count * width) / depth))));
  const rows = Math.ceil(count / columns);
  const cellWidth = width / columns, cellDepth = depth / rows;
  const scale = Math.min(1, cellWidth, cellDepth);
  return Array.from({ length: count }, (_, index) => ({
    x: ((index % columns) + 0.5) * cellWidth - width / 2,
    z: (Math.floor(index / columns) + 0.5) * cellDepth - depth / 2,
    scale,
  }));
}
