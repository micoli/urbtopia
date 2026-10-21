interface Leg {
  distance: number;
  stops: number;
}

interface LegLine {
  loop?: boolean;
  offsets: number[];
  stops: number[];
}

export function legBetween(line: LegLine, start: number, end: number): Leg {
  if (!line.loop) return { distance: Math.abs(line.offsets[end]! - line.offsets[start]!), stops: Math.abs(end - start) };
  if (end > start) return { distance: line.offsets[end]! - line.offsets[start]!, stops: end - start };
  return { distance: line.offsets[line.stops.length]! - line.offsets[start]! + line.offsets[end]!, stops: line.stops.length - start + end };
}
