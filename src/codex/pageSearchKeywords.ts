import { itemName } from '../i18n/itemName';
import { t } from '../i18n/t';
import type { CodexPage } from './pages';
import { PRODUCTION_CHAINS, type ChainItem } from './productionChains';

function namesOfItem(chainItem: ChainItem, names: Set<string>): void {
  names.add(itemName(chainItem.item));
  for (const good of chainItem.alsoAs) names.add(itemName(good));
  for (const step of chainItem.steps) {
    names.add(t(`building.${step.building}`));
    for (const output of step.outputs) namesOfItem(output, names);
  }
}

function chainsKeywords(): string {
  const names = new Set<string>();
  for (const root of PRODUCTION_CHAINS) {
    names.add(t(`building.${root.building}`));
    for (const item of root.items) namesOfItem(item, names);
  }
  return [...names].join(' ');
}

// The words a page shows in figures rather than in sentences, in the current language.
export function pageSearchKeywords(id: CodexPage): string | undefined {
  return id === 'chains' ? chainsKeywords() : undefined;
}
