import { SPORT_VENUES, SPORT_VENUE_TYPES, type SportVenueType } from '../core/leisure/sportVenues';

type SportVenueMessageKey = 'build.sport' | `codex.description.${SportVenueType}` | `event.unlocked.${SportVenueType}`;

export function sportVenueMessages(language: 'en' | 'fr'): Record<SportVenueMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const messages: Record<string, string> = { 'build.sport': 'Sport' };
  for (const type of SPORT_VENUE_TYPES) {
    const { name, intro, radius, wellbeingBonus, footprint, unlockCitizens, cost } = SPORT_VENUES[type];
    const { width, depth } = footprint;
    messages[`codex.description.${type}`] = language === 'en'
      ? `${intro[index]} It raises the Well-being of Homes in a ${2 * radius}-tile square around it (+${wellbeingBonus}, like a service) and needs no power. It covers ${width}×${depth} tiles; unlocks at ${unlockCitizens} Citizens, costs ${cost} Urbs.`
      : `${intro[index]} Il augmente le bien-être des logements à moins de ${2 * radius} cases (+${wellbeingBonus}) et ne consomme pas d’électricité. Il occupe ${width}×${depth} cases ; se débloque à ${unlockCitizens} citoyens, coûte ${cost} Urbs.`;
    messages[`event.unlocked.${type}`] = language === 'en'
      ? `New sport building available: ${name[index]}.`
      : `Nouveau bâtiment de sport disponible : ${name[index]}.`;
  }
  return messages as Record<SportVenueMessageKey, string>;
}
