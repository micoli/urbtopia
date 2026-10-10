import natureDescriptions from '../../assets/defs/descriptions/nature.json' with { type: 'json' };
import { renderDescription } from '../core/descriptions/messageFormat';
import { NATURE_FAMILIES, type NatureFamily } from '../core/environment/nature';

type NatureMessageKey = `codex.description.nature.${NatureFamily}`;

export function natureMessages(language: 'en' | 'fr'): Record<NatureMessageKey, string> {
  const help = Object.entries(NATURE_FAMILIES).map(([family, profile]) => [
    `codex.description.nature.${family}`,
    renderDescription(natureDescriptions.families[family as NatureFamily][language], language, { radius: profile.radius }),
  ]);
  return Object.fromEntries(help) as Record<NatureMessageKey, string>;
}
