import { shapeMask, type Shape } from './model.ts';

export function ShapePreview({ shape }: { shape: Shape }) {
  const mask = shapeMask(shape);
  return (
    <span className="studio-shape-preview" aria-hidden="true">
      {mask.flatMap((row, r) => row.map((on, c) => <i key={`${c}:${r}`} className={on ? 'on' : undefined} />))}
    </span>
  );
}
