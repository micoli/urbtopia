import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { BuildingDefinitions } from '../src/core/buildings/buildingDefinition.ts';
import { BUILDINGS_DIR, readBuildings, writeBuildings } from './buildingsFile.ts';
import { allBuildingProblems, allModelProblems, describeProblem, type ModelDefinitions } from './definitionProblems.ts';
import { installablePacks, shipsModel } from './modelReferences.ts';
import { readModels, writeModels } from './modelsFile.ts';

export const SAVE_FIXTURES_DIR = 'src/persistence/fixtures';

export interface Definitions {
  models: ModelDefinitions;
  buildings: BuildingDefinitions;
}

export interface Catalog extends Definitions {
  installablePacks: string[];
}

export const readCatalog = (): Catalog => ({ models: readModels(), buildings: readBuildings(), installablePacks: installablePacks() });

// Both files are checked together before either is written, so a save never leaves a building pointing to a missing model.
export function saveDefinitions({ models, buildings }: Definitions): void {
  const problems = [...allModelProblems(models), ...allBuildingProblems(buildings, { models, ships: shipsModel() })];
  if (problems.length) throw new Error(problems.map(describeProblem).join('\n'));
  writeModels(models);
  writeBuildings(buildings);
}

const savesHolding = (id: string, fixtures: string): string[] => {
  if (!existsSync(fixtures)) return [];
  const pattern = new RegExp(`"type":\\s*"${id}"`);
  return readdirSync(fixtures).filter(file => file.endsWith('.json') && pattern.test(readFileSync(join(fixtures, file), 'utf8')));
};

// A building id lives in saves: it is removed for real only when no save fixture holds it; otherwise it is retired.
export function deleteBuilding(id: string, paths = { buildings: BUILDINGS_DIR, fixtures: SAVE_FIXTURES_DIR }): void {
  const file = join(paths.buildings, `${id}.json`);
  if (!existsSync(file)) throw new Error(`Unknown building ${id}`);
  const saves = savesHolding(id, paths.fixtures);
  if (saves.length) throw new Error(`${id} is in saves (${saves.join(', ')}): retire it instead`);
  rmSync(file);
}
