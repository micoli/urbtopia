import type { FactLine } from '../../codex/fixtureFacts';
import { t } from '../../i18n/t';

export function fixtureFactText({ key, values = {}, names = {} }: FactLine): string {
  const literals = Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), t(key));
  return Object.entries(names).reduce((text, [name, keys]) => text.replace(`{${name}}`, keys.map(item => t(item).toLowerCase()).join(', ')), literals);
}
