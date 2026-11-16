import { factoryAdvanced } from './factoryAdvanced';
import { factoryIntermediate } from './factoryIntermediate';
import { factorySimple } from './factorySimple';
import { workshopAdvanced } from './workshopAdvanced';
import { workshopIntermediate } from './workshopIntermediate';
import { workshopSimple } from './workshopSimple';
import type { Demonstration } from './scenario';
import type { BuildingType } from '../engine/state';

export const DEMONSTRATIONS: readonly Demonstration[] = [factorySimple, factoryIntermediate, factoryAdvanced, workshopSimple, workshopIntermediate, workshopAdvanced];
export const demonstrationsOf = (type: BuildingType) => DEMONSTRATIONS.filter(scenario => scenario.buildingType === type);
