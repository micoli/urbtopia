import { FIXTURES, floorBenefitsOf, type VenueFixture } from '../../core';
import { t } from '../../i18n/t';

interface FloorBenefitsProps {
  fixtures: readonly VenueFixture[];
  fixture: VenueFixture;
}

const percent = (share: number): string => `+${Math.round(share * 100)} %`;

const fill = (text: string, values: Record<string, string | number>): string => Object.entries(values).reduce((out, [key, value]) => out.replace(`{${key}}`, String(value)), text);

// What a selected Fixture of a Factory floor brings to it: its own bonus, the cooling it gives or gets, and what the variety of Machines adds.
export function FloorBenefits({ fixtures, fixture }: FloorBenefitsProps) {
  const spec = FIXTURES[fixture.type];
  const benefits = floorBenefitsOf(fixtures, fixture);
  const lines: string[] = [];
  if (spec.role === 'motor') lines.push(benefits.cooling > 0 ? fill(t('factory.floor.benefit.motorCooled'), { share: percent(benefits.cooling), machines: benefits.coolsMachines }) : t('factory.floor.benefit.motorIdle'));
  const own = [benefits.speed > 0 && `${t('factory.floor.speed')} ${percent(benefits.speed)}`, benefits.yield > 0 && `${t('factory.floor.yield')} ${percent(benefits.yield)}`].filter(Boolean);
  if (own.length > 0) lines.push(fill(t('factory.floor.benefit.own'), { bonus: own.join(', ') }));
  if (spec.role === 'machine' && spec.coolant === undefined && benefits.cooling > 0) lines.push(fill(t('factory.floor.benefit.cooled'), { share: percent(benefits.cooling) }));
  if (spec.coolant !== undefined) {
    if (benefits.coolsMotors > 0) lines.push(fill(t('factory.floor.benefit.vat'), { motors: benefits.coolsMotors, share: percent(benefits.cooling), machines: benefits.coolsMachines }));
    else if (benefits.cooling > 0) lines.push(t('factory.floor.benefit.vatIdle'));
    if (benefits.doubled) lines.push(t('factory.floor.benefit.doubled'));
  }
  if (benefits.powerSaving > 0) lines.push(fill(t('factory.floor.benefit.boilerPower'), { share: `${Math.round(benefits.powerSaving * 100)} %` }));
  if (spec.heat) lines.push(benefits.heatsVats > 0 ? fill(t('factory.floor.benefit.boiler'), { count: benefits.heatsVats }) : t('factory.floor.benefit.boilerIdle'));
  if (spec.role === 'machine' && benefits.variety > 0) lines.push(fill(t('factory.floor.benefit.variety'), { share: percent(benefits.variety) }));
  return <>{lines.map(line => <p key={line} className="note">{line}</p>)}</>;
}
