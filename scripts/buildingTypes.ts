import type { BuildingDefinitions } from '../src/core/buildings/buildingDefinition.ts';
import { idTypesSource } from './collectionFiles.ts';
import { specOf, type Definition } from './collections.ts';

export const BUILDING_TYPES_FILE = specOf('buildings').idTypes.file;

export const buildingTypesSource = (definitions: BuildingDefinitions): string => idTypesSource('buildings', definitions as Record<string, Definition>);
