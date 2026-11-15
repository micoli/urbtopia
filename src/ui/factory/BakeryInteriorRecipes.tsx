import { useMemo } from 'react';
import { FIXTURES, STAFF, interiorBonusOfBuilding, interiorCapsOfType, interiorLayoutOf, interiorPowerOfBuilding, interiorWagesPerHour, type Building } from '../../core';
import { t } from '../../i18n/t';
import { UrbsAmount } from '../common/UrbsAmount';
import { formatPercent } from './formatPercent';
import {LabeledList} from "../common/LabeledList.tsx";

interface InteriorRecipesProps {
  factory: Building;
}

const limitOf = (factory: Building, from: string): number => interiorLayoutOf(factory.type)?.feeds?.find(feed => feed.from === from)?.max ?? 0;

// The recipe of a Bakery: how its Fixtures are put together, what each adds and caps at the Tier, and what it costs to run.
export function BakeryInteriorRecipes({ factory }: InteriorRecipesProps) {
  const { caps, bonus, power } = useMemo(() => ({
    caps: interiorCapsOfType(factory.type, factory.tier),
    bonus: interiorBonusOfBuilding(factory),
    power: interiorPowerOfBuilding(factory),
  }), [factory]);
  const fill = (key: Parameters<typeof t>[0], values: Record<string, string>) => Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), t(key));
  return (
    <>
      <h3>{t('bakery.recipes.assembly')}</h3>
      <p className="note">{fill('bakery.recipes.limits', { mixer: String(limitOf(factory, 'mixer')), oven: String(limitOf(factory, 'oven')) })}</p>
      <h3>{t('bakery.recipes.bonuses')}</h3>
      <LabeledList>
          <LabeledList.Row label={t('bakery.recipes.mixer.title')}>{fill('bakery.recipes.mixer.value', { value: formatPercent(FIXTURES.bakeryMixer.speed ?? 0) })}</LabeledList.Row>
          <LabeledList.Row label={t('bakery.recipes.oven.title')}>{fill('bakery.recipes.oven.value', { value: formatPercent(FIXTURES.bakeryOven.speed ?? 0) })}</LabeledList.Row>
          <LabeledList.Row label={t('bakery.recipes.counter.title')}>{fill('bakery.recipes.counter.value', { value: formatPercent(FIXTURES.bakeryCounter.sales ?? 0), yield: formatPercent(FIXTURES.bakeryCounter.yield ?? 0), power: (FIXTURES.bakeryCounter.power ?? 0).toFixed(1) })}</LabeledList.Row>
          <LabeledList.Row label={t('bakery.recipes.caps.title')}>{fill('bakery.recipes.caps.value', { speed: formatPercent(caps.speed), yield: formatPercent(caps.yield), sales: formatPercent(caps.sales ?? 0) })}</LabeledList.Row>
          <LabeledList.Row label={t('bakery.recipes.now.title')}>{fill('bakery.recipes.now.value', { speed: formatPercent(bonus.speed), yield: formatPercent(bonus.yield), sales: formatPercent(bonus.sales ?? 0) })}</LabeledList.Row>
      </LabeledList>
      <h3>{t('bakery.recipes.consumption')}</h3>
      <LabeledList>
        <LabeledList.Row label={t('bakery.recipes.mixer.title')}>{fill('bakery.recipes.power', { value: power.toFixed(1) })}</LabeledList.Row>
        <LabeledList.Row label={t('bakery.recipes.mixer.title')}>{t('bakery.recipes.wages')} <UrbsAmount value={interiorWagesPerHour(factory)} /> / h</LabeledList.Row>
        <LabeledList.Row label={t('interior.role.baker')}>{t('bakery.recipes.wages')} <UrbsAmount value={STAFF.dailyWage.baker} /> {t('venue.wage')}</LabeledList.Row>
        <LabeledList.Row label={t('interior.role.seller')}>{t('bakery.recipes.wages')} <UrbsAmount value={STAFF.dailyWage.seller} /> {t('venue.wage')}</LabeledList.Row>
      </LabeledList>
    </>
  );
}
