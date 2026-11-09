import { FIXTURES, floorLinksOf, floorMotorLoadOf, type Building, type VenueFixture } from '../../core';
import { t } from '../../i18n/t';
import { FloorBenefits } from './FloorBenefits';

interface FloorMachineStatusProps {
  factory: Building;
  fixture: VenueFixture;
}

// What a selected Machine of a Factory floor lacks, or that it is linked; for a Motor, how many Machines it drives out of how many it can.
export function FloorMachineStatus({ factory, fixture }: FloorMachineStatusProps) {
  const role = FIXTURES[fixture.type].role;
  if (role === 'motor') {
    const { driven, capacity, overloaded } = floorMotorLoadOf(factory.floor?.fixtures ?? [], fixture);
    return (
      <>
        <p className="note">{t('factory.floor.motorLoad').replace('{driven}', String(driven)).replace('{capacity}', String(capacity))}</p>
        {overloaded > 0 && <p className="note note--warn">{t('factory.floor.motorOverloaded').replace('{count}', String(overloaded))}</p>}
        <FloorBenefits fixtures={factory.floor?.fixtures ?? []} fixture={fixture} />
      </>
    );
  }
  if (role !== 'machine') return null;
  const links = floorLinksOf(factory.floor?.fixtures ?? []);
  if (links.linked.has(fixture.id)) return <><p className="note">{t('factory.floor.linkedMachine')}</p><FloorBenefits fixtures={factory.floor?.fixtures ?? []} fixture={fixture} /></>;
  const problems = links.problems.get(fixture.id) ?? [];
  return <>{problems.map(problem => <p key={problem} className="note note--warn">{t(`factory.floor.problem.${problem}`)}</p>)}</>;
}
