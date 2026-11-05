import { BOATS, ECOLOGY, FLEET_VEHICLES, MAX_CASINO_TIER, ORDINANCE_ENTRIES, TRANSIT, casinoPower } from '../core';
import type { MessageKey } from '../i18n/messages';
import { t } from '../i18n/t';

export interface RecurringCost {
  label: string;
  value: string;
}

export interface RecurringCostGroup {
  title: MessageKey;
  rows: RecurringCost[];
}

type CostUnit = 'codex.cost.perHour' | 'codex.cost.perDay' | 'codex.cost.perShow';

const amountText = (unit: CostUnit, amount: number): string => t(unit).replace('{amount}', String(Math.round(amount * 100) / 100));

function boatRows(): RecurringCost[] {
  const casinoTiers = Array.from({ length: MAX_CASINO_TIER }, (_, index) => index + 1);
  const { pirate, frigate } = BOATS;
  return [
    { label: t('boat.pleasure'), value: amountText('codex.cost.perHour', BOATS.pleasure.operatingCostPerHour) },
    ...casinoTiers.map(tier => ({ label: `${t('boat.casino')} · ${t('codex.cost.tier').replace('{tier}', String(tier))}`, value: amountText('codex.cost.perHour', casinoPower(tier) * ECOLOGY.backupCost) })),
    { label: t('boat.pirate'), value: amountText('codex.cost.perShow', pirate.showCost) },
    { label: t('boat.frigate'), value: amountText('codex.cost.perShow', frigate.showCost) },
  ];
}

function transitRows(): RecurringCost[] {
  return [
    { label: t('codex.cost.busLine'), value: amountText('codex.cost.perHour', ECOLOGY.busCost) },
    ...FLEET_VEHICLES.map(({ id }) => ({ label: t(`transit.${id}`), value: amountText('codex.cost.perHour', TRANSIT[id].cost) })),
  ];
}

const ordinanceRows = (): RecurringCost[] =>
  ORDINANCE_ENTRIES.map(entry => ({ label: t(`ordinance.${entry.id}.name` as MessageKey), value: amountText('codex.cost.perDay', entry.upkeepPerDay) }));

// Costs charged on a schedule by something that is not a building page: boats, transit and Ordinances.
export function recurringCostGroups(): RecurringCostGroup[] {
  return [
    { title: 'codex.cost.boats', rows: boatRows() },
    { title: 'codex.cost.transit', rows: transitRows() },
    { title: 'codex.cost.ordinances', rows: ordinanceRows() },
  ];
}
