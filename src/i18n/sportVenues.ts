import { SPORT_VENUES, SPORT_VENUE_TYPES, type SportVenueType } from '../core/leisure/sportVenues';

type SportVenueMessageKey = 'build.sport' | `event.unlocked.${SportVenueType}`;

export function sportVenueMessages(language: 'en' | 'fr'): Record<SportVenueMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const messages: Record<string, string> = { 'build.sport': 'Sport' };
  for (const type of SPORT_VENUE_TYPES) {
    const { name } = SPORT_VENUES[type];
    messages[`event.unlocked.${type}`] = language === 'en'
      ? `New sport building available: ${name[index]}.`
      : `Nouveau bâtiment de sport disponible : ${name[index]}.`;
  }
  return messages as Record<SportVenueMessageKey, string>;
}
