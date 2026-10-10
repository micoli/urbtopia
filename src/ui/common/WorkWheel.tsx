import type { QueueEntry } from '../../core';
import { progressColor } from './progressColor';
import { sectorPath, wheelSegments } from './workWheel';

const RADIUS = 15;

interface WorkWheelProps {
  queue: readonly QueueEntry[];
  now: number;
}

export function WorkWheel({ queue, now }: WorkWheelProps) {
  const segments = wheelSegments(queue, now);
  return (
    <svg className="work-wheel" viewBox="-16 -16 32 32" aria-hidden="true">
      <g className="work-wheel-turn">
        {segments.map((segment, index) => (
          <g key={index} className={`work-wheel-segment work-wheel-segment--${segment.state}`}>
            <path className="work-wheel-track" d={sectorPath(RADIUS, segment.startAngle, segment.endAngle)} />
            <path className="work-wheel-fill" d={sectorPath(RADIUS * segment.progress, segment.startAngle, segment.endAngle)} fill={progressColor(segment.progress, 1)} />
          </g>
        ))}
        {segments.length > 1 ? (
          segments.map((segment, index) => <path key={index} className="work-wheel-edge" d={sectorPath(RADIUS, segment.startAngle, segment.endAngle)} />)
        ) : (
          <path className="work-wheel-edge" d={`M 0 0 L 0 ${-RADIUS}`} />
        )}
      </g>
    </svg>
  );
}
