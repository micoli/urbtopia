import definitions from '../../../assets/models.json' with { type: 'json' };
import type { ModelDefinition } from '../../scene/modelDefinitions';
import type { NatureBuildingDefinition, SportBuildingDefinition } from './buildingDefinition';

type Placed<B> = { model: string; definition: ModelDefinition; building: B };

const placed = Object.entries(definitions as unknown as Record<string, ModelDefinition>)
  .flatMap(([model, definition]) => (definition.building ? [{ model, definition, building: definition.building }] : []));

export const SPORT_DEFINITIONS = placed.filter((entry): entry is Placed<SportBuildingDefinition> => entry.building.kind === 'sport');

export const NATURE_DEFINITIONS = placed.filter((entry): entry is Placed<NatureBuildingDefinition> => entry.building.kind === 'nature');
