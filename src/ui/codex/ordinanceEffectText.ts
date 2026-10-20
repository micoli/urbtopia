import type { OrdinanceEffect } from '../../core';
import { t } from '../../i18n/t';

const PERCENT = 100;

const percent = (share: number): string => String(Math.round(share * PERCENT));

function valueOf(effect: OrdinanceEffect): string {
  switch (effect.kind) {
    case 'taxMultiplier': return String(effect.multiplier);
    case 'wasteSorting': return percent(effect.reduction);
    case 'greenBelt': return String(effect.wellbeingBonus);
    case 'transitSubsidy': return percent(effect.congestionRelief);
    case 'energySaving': return percent(effect.demandReduction);
    case 'officeRelief': return String(effect.yieldMultiplier);
    case 'culturalFestival': return String(effect.esteemBonus);
  }
}

// What an Ordinance does, in the player's words, from the values of its data.
export function ordinanceEffectText(effect: OrdinanceEffect): string {
  return t(`codex.politics.effect.${effect.kind}`).replace('{value}', valueOf(effect));
}
