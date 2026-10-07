import { SPORT_ENTRIES } from '../buildings/buildingDefinitions.ts';
import type { SportVenueType } from '../buildings/buildingTypes.generated.ts';

export type { SportVenueType };

export interface SportVenue {
  model: string;
  unlockCitizens: number;
  cost: number;
  footprint: { width: number; depth: number };
  radius: number;
  wellbeingBonus: number;
  name: readonly [en: string, fr: string];
  intro: readonly [en: string, fr: string];
}

export const SPORT_VENUES = Object.fromEntries(SPORT_ENTRIES.map(({ id, model, footprint, unlockCitizens, cost, sport, name, description }): [string, SportVenue] => {
  const [width, depth] = footprint!;
  const intro = description ?? name;
  return [id, { model, unlockCitizens: unlockCitizens!, cost: cost!, footprint: { width, depth }, radius: sport.radius, wellbeingBonus: sport.wellbeingBonus, name: [name.en, name.fr], intro: [intro.en, intro.fr] }];
})) as Record<SportVenueType, SportVenue>;

export const SPORT_VENUE_TYPES = Object.keys(SPORT_VENUES) as SportVenueType[];

export const isSportVenueType = (type: string): type is SportVenueType => type in SPORT_VENUES;
