import type { MapNode, TransportMapModel } from './transportMapModel.ts';
import type { MapSegment } from './networkLayers.ts';

interface TransportMapLayersProps {
  model: TransportMapModel;
  nodes: ReadonlyMap<number, MapNode>;
  roads: boolean;
  pedestrianWays: boolean;
  unit: number;
}

export const ROAD_COLOR = '#aab2bf';
export const PEDESTRIAN_COLOR = '#7ee0a0';

const pathOf = (segments: readonly MapSegment[]): string => segments.map(s => `M${s.x1},${s.y1}L${s.x2},${s.y2}`).join('');

// The networks the stops stand on, under the lines: their real shape, and where the stops and the Pedestrian ways join them.
export function TransportMapLayers({ model, nodes, roads, pedestrianWays, unit }: TransportMapLayersProps) {
  const shown = model.connections.filter(connection => (connection.network === 'road' ? roads : pedestrianWays) && nodes.has(connection.stop));
  return <g className="transport-map-layers" aria-hidden="true">
    {roads && <path className="transport-map-roads" d={pathOf(model.roads)} fill="none" stroke={ROAD_COLOR} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.45} />}
    {pedestrianWays && <path className="transport-map-pedestrian-ways" d={pathOf(model.pedestrianWays)} fill="none" stroke={PEDESTRIAN_COLOR} strokeWidth={2.5} strokeDasharray="4 3" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.85} />}
    {roads && pedestrianWays && model.junctions.map(junction => <rect
      key={`${junction.x}:${junction.y}`}
      className="transport-map-junction"
      x={junction.x - 3.5 * unit}
      y={junction.y - 3.5 * unit}
      width={7 * unit}
      height={7 * unit}
      fill={PEDESTRIAN_COLOR}
      stroke="#fff"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
    />)}
    {shown.map(connection => {
      const stop = nodes.get(connection.stop)!;
      const color = connection.network === 'road' ? ROAD_COLOR : PEDESTRIAN_COLOR;
      return <g key={`${connection.stop}:${connection.network}`} className="transport-map-connection" data-network={connection.network}>
        <line x1={stop.x} y1={stop.y} x2={connection.x} y2={connection.y} stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        <circle cx={connection.x} cy={connection.y} r={3.5 * unit} fill="#212529" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </g>;
    })}
  </g>;
}
