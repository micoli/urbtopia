import type { Mode } from './editorConstants.ts';
import { CURRENCY_TOKEN } from '../ui/common/CurrencyText.tsx';
import { t } from '../i18n/t';
import { CHIMNEY_PRICE, DORMER_PRICE } from '../core/architect/housePlan.ts';

export interface Hint {
  id: string;
  text: string;
}

// The explanation of the tab being used, shown over the 3D view until the player has understood it.
export function viewHint(mode: Mode, onRoofLevel: boolean): Hint | undefined {
  if (onRoofLevel) {
    const text = t('architect.hint.roofLevel').replace('{dormer}', `${DORMER_PRICE} ${CURRENCY_TOKEN}`).replace('{chimney}', `${CHIMNEY_PRICE} ${CURRENCY_TOKEN}`);
    return { id: 'roofLevel', text };
  }
  if (mode === 'footprint') return { id: 'footprint', text: t('architect.hint.footprint') };
  if (mode === 'facade') return { id: 'facade', text: t('architect.hint.facade') };
  if (mode === 'roof') return { id: 'roof', text: t('architect.hint.roof') };
  return undefined;
}
