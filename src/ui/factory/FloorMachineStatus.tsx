import { useMemo } from 'react';
import { FIXTURES, floorFixturesOf, floorLinksOf, floorMotorLoadOf, type Building, type VenueFixture } from '../../core';
import { t } from '../../i18n/t';
import { FloorBenefits } from './FloorBenefits';
import { LineStatus } from './LineStatus';

interface FloorMachineStatusProps {
  factory: Building;
  fixture: VenueFixture;
}

// What a selected Machine of a Factory floor lacks, or that it is linked; for a Motor, how many Machines it drives out of how many it can.
export function FloorMachineStatus({ factory, fixture }: FloorMachineStatusProps) {
  const fixtures = floorFixturesOf(factory);
  const role = FIXTURES[fixture.type].role;
  const status = useMemo(() => {
    if (role === 'motor') return { motor: floorMotorLoadOf(fixtures, fixture) };
    if (role === 'machine' || role === 'conveyor' || role === 'scanner' || role === 'exit') return { links: floorLinksOf(fixtures) };
    return {};
  }, [fixtures, fixture, role]);
  if (status.motor) {
    const { driven, capacity, overloaded } = status.motor;
    return (
      <>
        <p className="note">{t('factory.floor.motorLoad').replace('{driven}', String(driven)).replace('{capacity}', String(capacity))}</p>
        {overloaded > 0 && <p className="note note--warn">{t('factory.floor.motorOverloaded').replace('{count}', String(overloaded))}</p>}
        <FloorBenefits fixtures={fixtures} fixture={fixture} />
      </>
    );
  }
  if (!status.links) return null;
  if (role === 'conveyor' || role === 'scanner' || role === 'exit') return <LineStatus lined={status.links.lined.has(fixture.id)} fixture={fixture} fixtures={fixtures} />;
  if (factory.type === 'packhouse' && status.links.linked.has(fixture.id) && !status.links.lined.has(fixture.id)) return <><p className="note note--warn">{t('packhouse.floor.noExit')}</p></>;
  if (status.links.linked.has(fixture.id)) return <><p className="note">{t('factory.floor.linkedMachine')}</p><FloorBenefits fixtures={fixtures} fixture={fixture} /></>;
  const problems = status.links.problems.get(fixture.id) ?? [];
  return <>{problems.map(problem => <p key={problem} className="note note--warn">{t(`factory.floor.problem.${problem}`)}</p>)}</>;
}
