import { t } from '../i18n/t';
import type { ArchitectMessageKey } from '../i18n/architect';
import { AXES, BRICKS, PITCHES, ROOFS, SHAPES, type Axis, type Brick, type Pitch, type Roof, type Shape, type Split } from '../core/architect/housePlan.ts';

const labelsOf = <T extends string>(values: readonly T[], prefix: string): Record<T, string> =>
  Object.fromEntries(values.map((value) => [value, t(`${prefix}.${value}` as ArchitectMessageKey)])) as Record<T, string>;

export const BRICK_LABEL: Record<Brick, string> = labelsOf(BRICKS, 'architect.brick');
export const ROOF_LABEL: Record<Roof, string> = labelsOf(ROOFS, 'architect.roof');
export const AXIS_LABEL: Record<Axis, string> = labelsOf(AXES, 'architect.axis');
export const PITCH_LABEL: Record<Pitch, string> = labelsOf(PITCHES, 'architect.pitch');
export const SHAPE_LABEL: Record<Shape, string> = labelsOf(SHAPES, 'architect.shape');
export const SPLIT_LABEL: Record<Split, string> = labelsOf(['rows', 'cols'], 'architect.roof.split');
export const DIR_NAMES: string[] = [0, 1, 2, 3].map((dir) => t(`architect.dir.${dir}` as ArchitectMessageKey));
