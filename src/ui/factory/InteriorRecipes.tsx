import { useMemo } from 'react';
import { FIXTURES, STAFF, conditionOf, interiorBonusOfBuilding, interiorCapsOfType, interiorFixturesOf, interiorLayoutOf, interiorPowerOfBuilding, interiorWagesPerHour, repairCost, type Building, type FixtureId } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { UrbsAmount } from '../common/UrbsAmount';
import { formatPercent } from './formatPercent';

interface InteriorRecipesProps {
  factory: Building;
}

const limitOf = (factory: Building, from: string): number => interiorLayoutOf(factory.type)?.feeds?.find(feed => feed.from === from)?.max ?? 0;

// The recipe of a Bakery: how its Fixtures are put together, what each adds and caps at the Tier, and what it costs to run.
export function InteriorRecipes({ factory }: InteriorRecipesProps) {
  const { caps, bonus, power, repairs, repairLines } = useMemo(() => {
    const worn = interiorFixturesOf(factory).filter(fixture => repairCost(fixture) > 0);
    const lines = new Map<FixtureId, { type: FixtureId; count: number; condition: number; cost: number }>();
    for (const fixture of worn) {
      const line = lines.get(fixture.type) ?? { type: fixture.type, count: 0, condition: 100, cost: 0 };
      lines.set(fixture.type, { ...line, count: line.count + 1, condition: Math.min(line.condition, conditionOf(fixture)), cost: line.cost + repairCost(fixture) });
    }
    return {
      caps: interiorCapsOfType(factory.type, factory.tier),
      bonus: interiorBonusOfBuilding(factory),
      power: interiorPowerOfBuilding(factory),
      repairs: worn.reduce((total, fixture) => total + repairCost(fixture), 0),
      repairLines: [...lines.values()].sort((x, y) => y.cost - x.cost),
    };
  }, [factory]);
  const fill = (key: Parameters<typeof t>[0], values: Record<string, string>) => Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), t(key));
  return (
    <section className="venue-build" aria-label={t('venue.recipes')}>
      <div className="venue-build__items">
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
        <ActionButton block disabled={repairs === 0} onClick={() => gameStore.getState().send({ type: 'RepairAllInteriorFixtures', buildingId: factory.id })}>{t('venue.repairAll')} <UrbsAmount value={repairs} /></ActionButton>
        {repairLines.length > 0 ? (
          <ul className="note note--muted repair-detail">
            {repairLines.map(line => <li key={line.type}>{line.count > 1 ? `${line.count} × ` : ''}{t(`venue.fixture.${line.type}`)} · {Math.round(line.condition)} % · <UrbsAmount value={line.cost} /></li>)}
          </ul>
        ) : null}
        <p className="note note--muted">{t('interior.role.baker')} <UrbsAmount value={STAFF.dailyWage.baker} /> · {t('interior.role.seller')} <UrbsAmount value={STAFF.dailyWage.seller} /> {t('venue.wage')}</p>
      </div>
    </section>
  );
}
