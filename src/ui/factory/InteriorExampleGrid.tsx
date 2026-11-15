import { useMemo, type CSSProperties } from 'react';
import { fixtureFootprint, type ExampleFixture } from '../../core';
import { InteriorExamplePiece } from './InteriorExamplePiece';

interface InteriorExampleGridProps {
  fixtures: readonly ExampleFixture[];
}

interface Frame {
  columns: number;
  rows: number;
  fixtures: readonly ExampleFixture[];
}

const frameOf = (fixtures: readonly ExampleFixture[]): Frame => {
  const left = Math.min(...fixtures.map(fixture => fixture.x));
  const top = Math.min(...fixtures.map(fixture => fixture.y));
  const right = Math.max(...fixtures.map(fixture => fixture.x + fixtureFootprint(fixture.type, fixture.rotation).width));
  const bottom = Math.max(...fixtures.map(fixture => fixture.y + fixtureFootprint(fixture.type, fixture.rotation).depth));
  return {
    columns: right - left,
    rows: bottom - top,
    fixtures: fixtures.map(fixture => ({ ...fixture, x: fixture.x - left, y: fixture.y - top })),
  };
};

// The Fixtures seen from above, the back wall at the top, cropped to the tiles they cover and scaled down to fit where it is shown.
export function InteriorExampleGrid({ fixtures }: InteriorExampleGridProps) {
  const frame = useMemo(() => frameOf(fixtures), [fixtures]);
  const style = { '--example-columns': frame.columns, '--example-rows': frame.rows } as CSSProperties;
  return (
    <div className="interior-example__grid" style={style}>
      {frame.fixtures.map((fixture, index) => <InteriorExamplePiece key={index} fixture={fixture} />)}
    </div>
  );
}
