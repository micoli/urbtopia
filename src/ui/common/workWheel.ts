import { SHOP, stackSaleProgress, type QueueEntry, type ShopStack } from '../../core';

export type SegmentState = 'done' | 'running' | 'waiting';

export interface WheelSegment {
  startAngle: number;
  endAngle: number;
  state: SegmentState;
  progress: number;
}

const FULL_TURN = 360;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function stateOf(entry: QueueEntry): SegmentState {
  if (entry.done) return 'done';
  return entry.startedAt === null ? 'waiting' : 'running';
}

function progressOf(entry: QueueEntry, now: number): number {
  if (entry.done) return 1;
  if (entry.startedAt === null) return 0;
  return clamp01((now - entry.startedAt) / entry.duration);
}

interface WheelItem {
  duration: number;
  state: SegmentState;
  progress: number;
}

const stackState = (stack: ShopStack): SegmentState => (stack.nextSaleAt === null ? 'waiting' : 'running');

function stackItems(stacks: readonly ShopStack[], now: number, saleIntervalMs: number): WheelItem[] {
  return stacks
    .filter((stack) => stack.good !== null && stack.stock > 0)
    .map((stack) => ({ duration: SHOP.stackSize * saleIntervalMs, state: stackState(stack), progress: stackSaleProgress(stack, now, saleIntervalMs) }));
}

export function wheelSegments(queue: readonly QueueEntry[], now: number, stacks: readonly ShopStack[] = [], saleIntervalMs = 0): WheelSegment[] {
  const items: WheelItem[] = [
    ...queue.map((entry) => ({ duration: entry.duration, state: stateOf(entry), progress: progressOf(entry, now) })),
    ...stackItems(stacks, now, saleIntervalMs),
  ];
  const total = items.reduce((sum, item) => sum + item.duration, 0);
  if (total <= 0) return [];
  let cursor = 0;
  return items.map((item) => {
    const span = (item.duration / total) * FULL_TURN;
    const segment: WheelSegment = { startAngle: cursor, endAngle: cursor + span, state: item.state, progress: item.progress };
    cursor += span;
    return segment;
  });
}

const pointAt = (radius: number, degrees: number): [number, number] => {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return [radius * Math.cos(radians), radius * Math.sin(radians)];
};

export function sectorPath(radius: number, startAngle: number, endAngle: number): string {
  const span = endAngle - startAngle;
  if (span <= 0 || radius <= 0) return '';
  if (span >= FULL_TURN - 0.01) {
    return `M ${-radius} 0 A ${radius} ${radius} 0 1 1 ${radius} 0 A ${radius} ${radius} 0 1 1 ${-radius} 0 Z`;
  }
  const [startX, startY] = pointAt(radius, startAngle);
  const [endX, endY] = pointAt(radius, endAngle);
  const largeArc = span > 180 ? 1 : 0;
  return `M 0 0 L ${startX.toFixed(3)} ${startY.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${endX.toFixed(3)} ${endY.toFixed(3)} Z`;
}
