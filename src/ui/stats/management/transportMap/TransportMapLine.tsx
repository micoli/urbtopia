import type { MapLine, MapNode } from './transportMapModel.ts';
import { BASE_WIDTH, INACTIVE_COLOR, LEVEL_COLORS, LOAD_WIDTH, lineColor } from './transportMapStyle.ts';

interface TransportMapLineProps {
  line: MapLine;
  nodes: ReadonlyMap<number, MapNode>;
  dimmed: boolean;
  selected: boolean;
  onSelect: () => void;
}

const ARROW = 0.55;

function arrowPoints(from: MapNode, to: MapNode): string {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const cx = (from.x + to.x) / 2, cy = (from.y + to.y) / 2;
  const tip = { x: cx + Math.cos(angle) * ARROW, y: cy + Math.sin(angle) * ARROW };
  const left = { x: cx + Math.cos(angle + 2.5) * ARROW, y: cy + Math.sin(angle + 2.5) * ARROW };
  const right = { x: cx + Math.cos(angle - 2.5) * ARROW, y: cy + Math.sin(angle - 2.5) * ARROW };
  return [tip, left, right].map(p => `${p.x},${p.y}`).join(' ');
}

export function TransportMapLine({ line, nodes, dimmed, selected, onSelect }: TransportMapLineProps) {
  const stops = line.stops.map(id => nodes.get(id)).filter((node): node is MapNode => node !== undefined);
  if (stops.length < 2) return null;
  const path = `M${stops.map(node => `${node.x},${node.y}`).join(' L')}${line.loop ? ' Z' : ''}`;
  const width = BASE_WIDTH[line.mode] + line.load * LOAD_WIDTH;
  const color = line.active ? lineColor(line.id) : INACTIVE_COLOR;
  const segments = stops.map((node, index) => [node, stops[(index + 1) % stops.length]!] as const).slice(0, line.loop ? stops.length : stops.length - 1);
  return <g
    className="transport-map-line"
    data-line={line.id}
    data-mode={line.mode}
    data-active={line.active}
    opacity={dimmed ? 0.2 : 1}
    role="button"
    tabIndex={0}
    aria-pressed={selected}
    onClick={event => { event.stopPropagation(); onSelect(); }}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onSelect(); }}
  >
    <path d={path} fill="none" stroke="transparent" strokeWidth={16} vectorEffect="non-scaling-stroke" />
    {line.active && <path d={path} fill="none" stroke={LEVEL_COLORS[line.level]} strokeWidth={width + 4} strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.6} />}
    <path d={path} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeDasharray={line.active ? undefined : '6 5'} vectorEffect="non-scaling-stroke" />
    {line.active && line.mode === 'rail' && <path d={path} fill="none" stroke="#fff" strokeWidth={width} strokeDasharray="2 8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
    {line.active && line.mode === 'brt' && <path d={path} fill="none" stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.8} />}
    {line.loop && segments.map(([from, to], index) => <polygon key={index} className="transport-map-arrow" points={arrowPoints(from, to)} fill="#fff" stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
  </g>;
}
