import type { VenueType } from '../core';
import { definitionOf } from '../core/buildings/buildingDefinitions';
import { VENUE_CUSTOMER_MODELS } from '../core/infrastructure/infrastructure';
import { modelFileOf } from '../core/models/modelFiles';
import { VENUE_TYPES } from '../core/venues/profiles';

export { VENUE_CUSTOMER_MODELS };

// The staff of a Venue is the character shipped with its own pack. The Hotel is built from the furniture kit, which has none.
export const VENUE_STAFF_MODELS = Object.fromEntries(VENUE_TYPES.map(type => [type, definitionOf(type).staffModels!.map(modelFileOf)])) as unknown as Record<VenueType, readonly string[]>;

export const venueCrowdModelsOf = (venue: VenueType): readonly string[] => [...new Set([...VENUE_CUSTOMER_MODELS, ...VENUE_STAFF_MODELS[venue]])];
