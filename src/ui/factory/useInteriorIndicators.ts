import { useMemo } from 'react';
import { FIXTURES, interiorFixturesOf, interiorLinksOf, interiorPowerOfBuilding, type Building } from '../../core';
import { interiorEffectsOf, type InteriorEffect } from './interiorEffectsOf';

export interface InteriorIndicators {
  machines: number;
  linked: number;
  power: number;
  effects: InteriorEffect[];
}

// The Machines that are linked, the levers the building has and the power the Motors draw, as the interior shows them.
export function useInteriorIndicators(factory: Building): InteriorIndicators {
  const fixtures = interiorFixturesOf(factory);
  return useMemo(() => {
    const floor = { type: factory.type, tier: factory.tier, interior: factory.interior, breakerOff: factory.breakerOff };
    return {
      machines: fixtures.filter(fixture => FIXTURES[fixture.type].role === 'machine').length,
      linked: interiorLinksOf(fixtures).linked.size,
      power: interiorPowerOfBuilding(floor),
      effects: interiorEffectsOf(floor),
    };
  }, [fixtures, factory.type, factory.tier, factory.interior, factory.breakerOff]);
}
