import type { MapNode } from './transportMapModel.ts';

interface TransportMapNodeProps {
  node: MapNode;
  dimmed: boolean;
  selected: boolean;
  onSelect: () => void;
}

export function TransportMapNode({ node, dimmed, selected, onSelect }: TransportMapNodeProps) {
  const radius = node.hub ? 1.1 : 0.55;
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
    {node.carriesBikes && <text className="transport-map-bike" x={node.x + radius} y={node.y - radius} fontSize={1.1} aria-hidden="true">🚲</text>}
    <text className="transport-map-label" x={node.x} y={node.y + radius + 1.2} fontSize={1.1} textAnchor="middle" fill="currentColor" aria-hidden="true">{node.label}</text>
  </g>;
}
