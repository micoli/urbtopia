import type { BuildingDefinitions, FlatBuilding } from '../src/core/buildings/buildingDefinition.ts';
import { BUILDINGS_DIR } from './buildingsDir.ts';
import { jsonSchemaOf, schemaFileOf, stableDefinitionJson, writeCollection } from './collectionFiles.ts';
import type { Definition } from './collections.ts';
import { allBuildingProblems, buildingProblemsOf, describeProblem, type ModelCatalog } from './definitionProblems.ts';

export { BUILDINGS_DIR, readBuildings } from './buildingsDir.ts';

export const BUILDING_SCHEMA_FILE = schemaFileOf('buildings');

export const buildingProblems = (definition: unknown): string[] => buildingProblemsOf('', definition).map(({ path, message }) => (path ? `${path}: ${message}` : message));

export const buildingsProblems = (definitions: BuildingDefinitions, catalog?: ModelCatalog): string[] => allBuildingProblems(definitions, catalog).map(describeProblem);

export const stableBuildingJson = (definition: FlatBuilding): string => stableDefinitionJson('buildings', definition as Definition);

export const buildingJsonSchema = (): string => jsonSchemaOf('buildings');

export const writeBuildings = (definitions: BuildingDefinitions, dir = BUILDINGS_DIR): void => writeCollection('buildings', definitions as Record<string, Definition>, dir);
