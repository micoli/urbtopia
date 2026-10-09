import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import type { BuildingDefinitions, FlatBuilding } from '../src/core/buildings/buildingDefinition.ts';
import { BUILDING_ID_PATTERN, buildingSchema } from '../src/core/buildings/buildingSchema.ts';
import { BUILDINGS_DIR, buildingFilesIn, idOfBuildingFile } from './buildingsDir.ts';
import { writeBuildingTypes } from './buildingTypes.ts';
import { availableModelKeys, modelReferenceProblems } from './modelReferences.ts';

export { BUILDINGS_DIR, readBuildings } from './buildingsDir.ts';

export const BUILDING_SCHEMA_FILE = 'assets/defs/schemas/building.schema.json';

const SCHEMA_REFERENCE = '../schemas/building.schema.json';
const ORDER_STEP = 10;
const FIELD_ORDER = ['$schema', 'kind', 'order', 'section', 'model', 'footprint', 'cost', 'unlockCitizens', 'requiresRoad', 'accessModes', 'initialSlots', 'name', 'description', 'radius', 'wellbeingBonus', 'family'];

export function buildingProblems(definition: unknown): string[] {
  const result = buildingSchema.safeParse(definition);
  if (result.success) return [];
  return result.error.issues.map(issue => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message));
}

export function buildingsProblems(definitions: BuildingDefinitions, models?: ReadonlySet<string>): string[] {
  const seen = new Set<string>();
  const idProblems = Object.keys(definitions).flatMap(id => {
    const folded = id.toLowerCase();
    const duplicate = seen.has(folded);
    seen.add(folded);
    return [
      ...(BUILDING_ID_PATTERN.test(id) ? [] : [`${id}: id must start with a letter and use letters, digits or hyphens`]),
      ...(duplicate ? [`${id}: id differs from another one by case only`] : []),
    ];
  });
  const definitionProblems = Object.entries(definitions).flatMap(([id, definition]) => buildingProblems(definition).map(problem => `${id}: ${problem}`));
  return [...idProblems, ...definitionProblems, ...(models ? modelReferenceProblems(definitions, models) : [])];
}

// JSON strings never hold a raw newline, so only real arrays of scalars are put on one line.
const inlineScalarArrays = (json: string) => json.replace(/\[\n\s+([^[\]{}]*?)\n\s*\]/g, (_, items: string) => `[${items.split(/,\n\s+/).join(', ')}]`);

export function stableBuildingJson(definition: FlatBuilding): string {
  const fields: Record<string, unknown> = { $schema: SCHEMA_REFERENCE, ...definition };
  const keys = [...FIELD_ORDER.filter(key => key in fields), ...Object.keys(fields).filter(key => !FIELD_ORDER.includes(key))];
  return `${inlineScalarArrays(JSON.stringify(Object.fromEntries(keys.filter(key => fields[key] !== undefined).map(key => [key, fields[key]])), null, 2))}\n`;
}

export const buildingJsonSchema = (): string => `${JSON.stringify(z.toJSONSchema(buildingSchema), null, 2)}\n`;

const writeIfChanged = (file: string, content: string) => {
  if (existsSync(file) && readFileSync(file, 'utf8') === content) return;
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, content);
  renameSync(temporary, file);
};

// The order of the entries is the build menu order: it is stored as `order`, in steps of ten.
export function writeBuildings(definitions: BuildingDefinitions, dir = BUILDINGS_DIR): void {
  const ordered: BuildingDefinitions = Object.fromEntries(Object.entries(definitions).map(([id, definition], index) => [id, { ...definition, order: (index + 1) * ORDER_STEP }]));
  const real = dir === BUILDINGS_DIR;
  const problems = buildingsProblems(ordered, real ? availableModelKeys() : undefined);
  if (problems.length) throw new Error(problems.join('; '));
  mkdirSync(dir, { recursive: true });
  for (const [id, definition] of Object.entries(ordered)) writeIfChanged(join(dir, `${id}.json`), stableBuildingJson(definition));
  for (const file of buildingFilesIn(dir)) if (!(idOfBuildingFile(file) in ordered)) rmSync(join(dir, file));
  if (!real) return;
  writeBuildingTypes(ordered);
  mkdirSync(dirname(BUILDING_SCHEMA_FILE), { recursive: true });
  writeIfChanged(BUILDING_SCHEMA_FILE, buildingJsonSchema());
}
