import { HOTEL, RESTAURANT, STAFF, STAFF_ROLES, SUPERMARKET, VENUE_TYPES, WEAR, hireFeeOf, minTierOfRole, staffRolesOf, type StaffRole, type VenueType } from '../core';
import type { MessageKey } from '../i18n/messages';

export interface StaffEffect {
  key: MessageKey;
  values: Record<string, string>;
}

export interface StaffFigures {
  role: StaffRole;
  dailyWage: number;
  hireFee: number;
  venues: readonly { type: VenueType; minTier: number }[];
  effects: readonly StaffEffect[];
}

const PERCENT = 100;
const MINUTES_PER_HOUR = 60;

const percent = (share: number): string => String(Math.round(share * PERCENT));
const effect = (key: MessageKey, values: Record<string, string | number> = {}): StaffEffect => ({ key, values: Object.fromEntries(Object.entries(values).map(([name, value]) => [name, String(value)])) });

const hiresForFullFront = Math.ceil((1 - STAFF.frontBaseRate) / STAFF.frontRatePerHire);

const frontEffects = (): StaffEffect[] => [
  effect('codex.staff.effect.front', { base: percent(STAFF.frontBaseRate), perHire: percent(STAFF.frontRatePerHire), full: hiresForFullFront }),
];

const EFFECTS: Record<StaffRole, () => StaffEffect[]> = {
  manager: () => [effect('codex.staff.effect.managerPrices'), effect('codex.staff.effect.managerYield', { bonus: percent(STAFF.managerYield - 1) })],
  employee: frontEffects,
  technician: () => [
    effect('codex.staff.effect.technicianRepair', { saved: percent(1 - WEAR.technicianRepairRatio) }),
    effect('codex.staff.effect.technicianWear', { saved: percent(1 - WEAR.technicianWear) }),
  ],
  security: () => [effect('codex.staff.effect.security', { loss: percent(1 - STAFF.withoutSecurityRate) })],
  cashier: frontEffects,
  stocker: () => [
    effect('codex.staff.effect.stocker', {
      units: SUPERMARKET.stockerUnitsPerPass,
      minutes: SUPERMARKET.stockerPassMinutes,
      perHour: SUPERMARKET.stockerUnitsPerPass * MINUTES_PER_HOUR / SUPERMARKET.stockerPassMinutes,
    }),
    effect('codex.staff.effect.stockerFee', { fee: percent(SUPERMARKET.restockFee) }),
  ],
  receptionist: () => [...frontEffects(), effect('codex.staff.effect.receptionist', { without: percent(HOTEL.withoutReceptionRate) })],
  housekeeper: () => [effect('codex.staff.effect.housekeeper', { rooms: HOTEL.housekeepingPerDay })],
  cook: () => [effect('codex.staff.effect.cook', { without: percent(RESTAURANT.withoutCookRate) })],
  kitchenAssistant: () => [effect('codex.staff.effect.kitchenAssistant', { boost: percent(RESTAURANT.assistantBoost) })],
  maitreD: frontEffects,
  waiter: () => [effect('codex.staff.effect.waiter', { covers: RESTAURANT.waiterCovers, without: RESTAURANT.withoutWaiterCovers })],
  bartender: () => [effect('codex.staff.effect.bartender', { without: percent(RESTAURANT.withoutBartenderRate) })],
};

export function staffFigures(): StaffFigures[] {
  return STAFF_ROLES.map(role => ({
    role,
    dailyWage: STAFF.dailyWage[role],
    hireFee: hireFeeOf(role),
    venues: VENUE_TYPES.filter(type => staffRolesOf(type).includes(role)).map(type => ({ type, minTier: minTierOfRole(type, role) })),
    effects: EFFECTS[role](),
  }));
}
