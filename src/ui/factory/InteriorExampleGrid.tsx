import { useMemo } from 'react';
import { fixtureFootprint, type ExampleFixture } from '../../core';
import { InteriorExamplePiece } from './InteriorExamplePiece';

interface InteriorExampleGridProps {
  fixtures: readonly ExampleFixture[];
}

const extentOf = (fixtures: readonly ExampleFixture[]): { columns: number; rows: number } => ({
  columns: Math.max(...fixtures.map(fixture => fixture.x + fixtureFootprint(fixture.type, fixture.rotation).width)),
  rows: Math.max(...fixtures.map(fixture => fixture.y + fixtureFootprint(fixture.type, fixture.rotation).depth)),
});

// The room seen from above, the back wall at the top, as small as the example allows.
export function InteriorExampleGrid({ fixtures }: InteriorExampleGridProps) {
  const { columns, rows } = useMemo(() => extentOf(fixtures), [fixtures]);
  return (
    <div className="interior-example__grid" style={{ gridTemplateColumns: `repeat(${columns}, var(--example-tile))`, gridTemplateRows: `repeat(${rows}, var(--example-tile))` }}>
      {fixtures.map((fixture, index) => <InteriorExamplePiece key={index} fixture={fixture} />)}
    </div>
  );
}
