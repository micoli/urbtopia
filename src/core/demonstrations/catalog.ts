import { bakeryAdvanced } from './bakeryAdvanced';
import { bakeryIntermediate } from './bakeryIntermediate';
import { bakerySimple } from './bakerySimple';
import { factoryAdvanced } from './factoryAdvanced';
import { factoryIntermediate } from './factoryIntermediate';
import { factorySimple } from './factorySimple';
import { packhouseAdvanced } from './packhouseAdvanced';
import { packhouseIntermediate } from './packhouseIntermediate';
import { packhouseSimple } from './packhouseSimple';
import { workshopAdvanced } from './workshopAdvanced';
import { workshopIntermediate } from './workshopIntermediate';
import { workshopSimple } from './workshopSimple';
import type { Demonstration } from './scenario';
import type { BuildingType } from '../engine/state';

export const DEMONSTRATIONS: readonly Demonstration[] = [factorySimple, factoryIntermediate, factoryAdvanced, workshopSimple, workshopIntermediate, workshopAdvanced, packhouseSimple, packhouseIntermediate, packhouseAdvanced, bakerySimple, bakeryIntermediate, bakeryAdvanced];
export const demonstrationsOf = (type: BuildingType) => DEMONSTRATIONS.filter(scenario => scenario.buildingType === type);
