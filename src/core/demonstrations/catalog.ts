import { factoryAdvanced } from './factoryAdvanced';
import { factoryIntermediate } from './factoryIntermediate';
import { factorySimple } from './factorySimple';
import type { Demonstration } from './scenario';
import type { BuildingType } from '../engine/state';

export const DEMONSTRATIONS: readonly Demonstration[] = [factorySimple, factoryIntermediate, factoryAdvanced];
export const demonstrationsOf = (type: BuildingType) => DEMONSTRATIONS.filter(scenario => scenario.buildingType === type);
