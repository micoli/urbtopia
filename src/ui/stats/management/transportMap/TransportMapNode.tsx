import { COORDINATES_SCALE, LABEL_TEXT_SIZE, LINE_HEIGHT, type LabelAnchor } from './labelLayout.ts';
import type { MapNode } from './transportMapModel.ts';

interface TransportMapNodeProps {
  node: MapNode;
  unit: number;
  labelAnchor: LabelAnchor | null;
  showCoordinates: boolean;
  dimmed: boolean;
  selected: boolean;
  onSelect: () => void;
}

// Sizes are in pixels and `unit` converts a pixel to map units, so they stay the same at any zoom.
const NODE_RADIUS = 5;
const HUB_RADIUS = 8;
const TEXT_SIZE = LABEL_TEXT_SIZE;
const COORDINATES_COLOR = '#9ca3af';
const BIKE_BADGE = 7;

export function TransportMapNode({ node, unit, labelAnchor, showCoordinates, dimmed, selected, onSelect }: TransportMapNodeProps) {
  const radius = (node.hub ? HUB_RADIUS : NODE_RADIUS) * unit;
  const text = TEXT_SIZE * unit;
  const labelX = labelAnchor === 'end' ? node.x + 6 * unit : labelAnchor === 'start' ? node.x - 6 * unit : node.x;
  return <g
    className="transport-map-node"
    data-stop={node.id}
    data-hub={node.hub}
    opacity={dimmed ? 0.25 : 1}
    role="button"
    tabIndex={0}
    aria-pressed={selected}
    aria-label={node.label}
    onClick={event => { event.stopPropagation(); onSelect(); }}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onSelect(); }}
  >
    <circle cx={node.x} cy={node.y} r={radius} fill="#fff" stroke={selected ? '#ffd43b' : '#212529'} strokeWidth={selected ? 3 : 2} vectorEffect="non-scaling-stroke" />
    {node.hub && <circle cx={node.x} cy={node.y} r={radius * 0.5} fill="#212529" />}
    {node.carriesBikes && <g className="transport-map-bike" aria-hidden="true">
      <circle cx={node.x + radius + BIKE_BADGE * unit} cy={node.y - radius - BIKE_BADGE * unit} r={BIKE_BADGE * unit} fill="#fff" />
      <text x={node.x + radius + BIKE_BADGE * unit} y={node.y - radius - BIKE_BADGE * unit} fontSize={BIKE_BADGE * 1.3 * unit} textAnchor="middle" dominantBaseline="central">🚲</text>
    </g>}
    {labelAnchor && <text className="transport-map-label" x={labelX} y={node.y + radius + text * 1.1} fontSize={text} textAnchor={labelAnchor} fill="currentColor" aria-hidden="true">
      <tspan fontWeight={node.hub ? 700 : 400}>{node.name}</tspan>
      {showCoordinates && <tspan className="transport-map-coordinates" x={labelX} dy={text * LINE_HEIGHT} fontSize={text * COORDINATES_SCALE} fill={COORDINATES_COLOR}>{node.coordinates}</tspan>}
    </text>}
  </g>;
}
