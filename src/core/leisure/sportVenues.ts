import { SPORT_DEFINITIONS } from '../buildings/buildingDefinitions';
import type { SportVenueType } from '../buildings/buildingTypes.generated';

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

export const SPORT_VENUES = Object.fromEntries(SPORT_DEFINITIONS.map(({ model, definition, building }): [string, SportVenue] => {
  const [width, depth] = definition.footprint ?? [1, 1];
  const { unlockCitizens, cost, radius, wellbeingBonus, name, description } = building;
  return [building.id, { model, unlockCitizens, cost, footprint: { width, depth }, radius, wellbeingBonus, name: [name.en, name.fr], intro: [description.en, description.fr] }];
})) as Record<SportVenueType, SportVenue>;

export const SPORT_VENUE_TYPES = Object.keys(SPORT_VENUES) as SportVenueType[];

export const isSportVenueType = (type: string): type is SportVenueType => type in SPORT_VENUES;
