import { useMemo } from 'react';
import { FIXTURES, interiorBenefitsOf, type VenueFixture } from '../../core';
import { t } from '../../i18n/t';
import { formatPercent } from './formatPercent';

interface InteriorBenefitsProps {
  fixtures: readonly VenueFixture[];
  fixture: VenueFixture;
}

const fill = (text: string, values: Record<string, string | number>): string => Object.entries(values).reduce((out, [key, value]) => out.replace(`{${key}}`, String(value)), text);

// What a selected Fixture of a Factory interior brings to it: its own bonus, the cooling it gives or gets, and what the variety of Machines adds.
export function InteriorBenefits({ fixtures, fixture }: InteriorBenefitsProps) {
  const spec = FIXTURES[fixture.type];
  const benefits = useMemo(() => interiorBenefitsOf(fixtures, fixture), [fixtures, fixture]);
  const lines: string[] = [];
  if (spec.role === 'motor') lines.push(benefits.cooling > 0 ? fill(t('factory.interior.benefit.motorCooled'), { share: formatPercent(benefits.cooling), machines: benefits.coolsMachines }) : t('factory.interior.benefit.motorIdle'));
  const own = [benefits.speed > 0 && `${t('factory.interior.speed')} ${formatPercent(benefits.speed)}`, benefits.yield > 0 && `${t('factory.interior.yield')} ${formatPercent(benefits.yield)}`].filter(Boolean);
  if (own.length > 0) lines.push(fill(t('factory.interior.benefit.own'), { bonus: own.join(', ') }));
  if (spec.role === 'machine' && spec.coolant === undefined && benefits.cooling > 0) lines.push(fill(t('factory.interior.benefit.cooled'), { share: formatPercent(benefits.cooling) }));
  if (spec.coolant !== undefined) {
    if (benefits.coolsMotors > 0) lines.push(fill(t('factory.interior.benefit.vat'), { motors: benefits.coolsMotors, share: formatPercent(benefits.cooling), machines: benefits.coolsMachines }));
    else if (benefits.cooling > 0) lines.push(t('factory.interior.benefit.vatIdle'));
    if (benefits.doubled) lines.push(t('factory.interior.benefit.doubled'));
  }
  if (benefits.powerSaving > 0) lines.push(fill(t('factory.interior.benefit.boilerPower'), { share: `${Math.round(benefits.powerSaving * 100)} %` }));
  if (spec.heat) lines.push(benefits.heatsVats > 0 ? fill(t('factory.interior.benefit.boiler'), { count: benefits.heatsVats }) : t('factory.interior.benefit.boilerIdle'));
  if (spec.role === 'machine' && benefits.variety > 0) lines.push(fill(t('factory.interior.benefit.variety'), { share: formatPercent(benefits.variety) }));
  return <>{lines.map(line => <p key={line} className="note">{line}</p>)}</>;
}
