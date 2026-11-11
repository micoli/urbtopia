import { useMemo } from 'react';
import { FIXTURES, interiorFixturesOf, interiorLinksOf, interiorMotorLoadOf, type Building, type VenueFixture } from '../../core';
import { t } from '../../i18n/t';
import { InteriorBenefits } from './InteriorBenefits';
import { LineStatus } from './LineStatus';

interface InteriorMachineStatusProps {
  factory: Building;
  fixture: VenueFixture;
}

// What a selected Machine of a Factory interior lacks, or that it is linked; for a Motor, how many Machines it drives out of how many it can.
export function InteriorMachineStatus({ factory, fixture }: InteriorMachineStatusProps) {
  const fixtures = interiorFixturesOf(factory);
  const role = FIXTURES[fixture.type].role;
  const status = useMemo(() => {
    if (role === 'motor') return { motor: interiorMotorLoadOf(fixtures, fixture) };
    if (role === 'machine' || role === 'conveyor' || role === 'scanner' || role === 'exit') return { links: interiorLinksOf(fixtures) };
    return {};
  }, [fixtures, fixture, role]);
  if (status.motor) {
    const { driven, capacity, overloaded } = status.motor;
    return (
      <>
        <p className="note">{t('factory.interior.motorLoad').replace('{driven}', String(driven)).replace('{capacity}', String(capacity))}</p>
        {overloaded > 0 && <p className="note note--warn">{t('factory.interior.motorOverloaded').replace('{count}', String(overloaded))}</p>}
        <InteriorBenefits fixtures={fixtures} fixture={fixture} />
      </>
    );
  }
  if (!status.links) return null;
  if (role === 'conveyor' || role === 'scanner' || role === 'exit') return <LineStatus lined={status.links.lined.has(fixture.id)} fixture={fixture} fixtures={fixtures} />;
  if (factory.type === 'packhouse' && status.links.linked.has(fixture.id) && !status.links.lined.has(fixture.id)) return <><p className="note note--warn">{t('packhouse.interior.noExit')}</p></>;
  if (status.links.linked.has(fixture.id)) return <><p className="note">{t('factory.interior.linkedMachine')}</p><InteriorBenefits fixtures={fixtures} fixture={fixture} /></>;
  const problems = status.links.problems.get(fixture.id) ?? [];
  return <>{problems.map(problem => <p key={problem} className="note note--warn">{t(`factory.interior.problem.${problem}`)}</p>)}</>;
}
