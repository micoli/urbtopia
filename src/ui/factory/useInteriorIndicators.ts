import { useMemo } from 'react';
import { FIXTURES, interiorBonusOfBuilding, interiorFixturesOf, interiorLinksOf, interiorPowerOfBuilding, type Building } from '../../core';

export interface InteriorIndicators {
  machines: number;
  linked: number;
  speed: number;
  yield: number;
  power: number;
}

// The Machines that are linked, the bonus they bring and the power the Motors draw, as the interior shows them.
export function useInteriorIndicators(factory: Building): InteriorIndicators {
  const fixtures = interiorFixturesOf(factory);
  return useMemo(() => {
    const floor = { type: factory.type, tier: factory.tier, interior: factory.interior };
    const bonus = interiorBonusOfBuilding(floor);
    return {
      machines: fixtures.filter(fixture => FIXTURES[fixture.type].role === 'machine').length,
      linked: interiorLinksOf(fixtures).linked.size,
      speed: bonus.speed,
      yield: bonus.yield,
      power: interiorPowerOfBuilding(floor),
    };
  }, [fixtures, factory.type, factory.tier, factory.interior]);
}
