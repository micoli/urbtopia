import type { BuildingDefinitions } from '../src/core/buildings/buildingDefinition.ts';
import { collectionDir, readCollectionDir } from './collectionRead.ts';

export const BUILDINGS_DIR = collectionDir('buildings');

export const readBuildings = (dir = BUILDINGS_DIR): BuildingDefinitions => readCollectionDir(dir) as BuildingDefinitions;
