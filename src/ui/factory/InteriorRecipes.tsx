import { useMemo } from 'react';
import { FIXTURES, STAFF, interiorBonusOfBuilding, interiorCapsOfType, interiorLayoutOf, interiorPowerOfBuilding, interiorWagesPerHour, type Building } from '../../core';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { formatPercent } from './formatPercent';

interface InteriorRecipesProps {
  factory: Building;
}

const limitOf = (factory: Building, from: string): number => interiorLayoutOf(factory.type)?.feeds?.find(feed => feed.from === from)?.max ?? 0;

// The recipe of a Bakery: how its Fixtures are put together, what each adds and caps at the Tier, and what it costs to run.
export function InteriorRecipes({ factory }: InteriorRecipesProps) {
  const { caps, bonus, power } = useMemo(() => ({
    caps: interiorCapsOfType(factory.type, factory.tier),
    bonus: interiorBonusOfBuilding(factory),
    power: interiorPowerOfBuilding(factory),
  }), [factory]);
  const fill = (key: Parameters<typeof t>[0], values: Record<string, string>) => Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), t(key));
  return (
    <>
      <h3>{t('bakery.recipes.assembly')}</h3>
      <ol>
        <li className="note">{t('bakery.recipes.drive')}</li>
        <li className="note">{t('bakery.recipes.gas')}</li>
        <li className="note">{t('bakery.recipes.line')}</li>
        <li className="note">{fill('bakery.recipes.limits', { mixer: String(limitOf(factory, 'mixer')), oven: String(limitOf(factory, 'oven')) })}</li>
      </ol>
      <h3>{t('bakery.recipes.bonuses')}</h3>
      <p className="note">{fill('bakery.recipes.mixer', { value: formatPercent(FIXTURES.bakeryMixer.speed ?? 0) })}</p>
      <p className="note">{fill('bakery.recipes.oven', { value: formatPercent(FIXTURES.bakeryOven.speed ?? 0) })}</p>
      <p className="note">{fill('bakery.recipes.counter', { value: formatPercent(FIXTURES.bakeryCounter.sales ?? 0), yield: formatPercent(FIXTURES.bakeryCounter.yield ?? 0), power: (FIXTURES.bakeryCounter.power ?? 0).toFixed(1) })}</p>
      <p className="note">{fill('bakery.recipes.caps', { speed: formatPercent(caps.speed), yield: formatPercent(caps.yield), sales: formatPercent(caps.sales ?? 0) })}</p>
      <p className="note">{t('bakery.recipes.staffParts')}</p>
      <p className="note">{fill('bakery.recipes.now', { speed: formatPercent(bonus.speed), yield: formatPercent(bonus.yield), sales: formatPercent(bonus.sales ?? 0) })}</p>
      <h3>{t('bakery.recipes.consumption')}</h3>
      <p className="note">{fill('bakery.recipes.power', { value: power.toFixed(1) })}</p>
      <p className="note">{t('bakery.recipes.wages')} <UrbsAmount value={interiorWagesPerHour(factory)} /> / h</p>
      <p className="note note--muted">{t('interior.role.baker')} <UrbsAmount value={STAFF.dailyWage.baker} /> · {t('interior.role.seller')} <UrbsAmount value={STAFF.dailyWage.seller} /> {t('venue.wage')}</p>
    </>
  );
}
