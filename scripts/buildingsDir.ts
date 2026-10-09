import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { BuildingDefinitions, FlatBuilding } from '../src/core/buildings/buildingDefinition.ts';

export const BUILDINGS_DIR = 'assets/defs/buildings';

export const idOfBuildingFile = (file: string) => basename(file, '.json');
export const buildingFilesIn = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter(file => file.endsWith('.json')) : []);

const withoutSchema = ({ $schema: _schema, ...definition }: FlatBuilding & { $schema?: string }): FlatBuilding => definition;

// Node side of the game's import.meta.glob: the building files of a directory, in build menu order.
export function readBuildings(dir = BUILDINGS_DIR): BuildingDefinitions {
  const entries = buildingFilesIn(dir).map((file): [string, FlatBuilding] => [idOfBuildingFile(file), withoutSchema(JSON.parse(readFileSync(join(dir, file), 'utf8')))]);
  return Object.fromEntries(entries.sort(([idA, a], [idB, b]) => (a.order ?? 0) - (b.order ?? 0) || idA.localeCompare(idB)));
}
