import { FIXTURES, fixtureIdsOf, type Building, type FixtureVenue } from '../../core';
import { t } from '../../i18n/t';

interface InteriorConveyorsProps {
  building: Building;
}

// The pieces of Conveyor that a Line interior offers: straight, elbows, joiners, splitters and tees, as far as it has them.
export function InteriorConveyors({ building }: InteriorConveyorsProps) {
  const conveyors = fixtureIdsOf(building.type as FixtureVenue).filter(id => FIXTURES[id].role === 'conveyor');
  if (conveyors.length === 0) return null;
  return (
    <>
      <h3>{t('interior.conveyors')}</h3>
      <ul>
        {conveyors.map(id => <li key={id} className="note">{t(`venue.fixture.${id}`)}</li>)}
      </ul>
    </>
  );
}
