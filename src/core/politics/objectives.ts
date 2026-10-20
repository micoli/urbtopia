import { entriesOf } from '../defs/entries';
import objectiveOrder from '../../../assets/defs/order/objectives.json' with { type: 'json' };
import type { ObjectiveDefinition } from './objectiveSchema';
import type { ObjectiveId } from './objectiveTypes.generated';

export type { ObjectiveId };

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const files = import.meta.glob<ObjectiveDefinition>('../../../assets/defs/objectives/*.json', { eager: true, import: 'default' });

export const OBJECTIVE_ENTRIES = entriesOf<ObjectiveDefinition, ObjectiveId>(files, objectiveOrder);

export const objectiveById = (id: ObjectiveId): (typeof OBJECTIVE_ENTRIES)[number] => OBJECTIVE_ENTRIES.find(entry => entry.id === id)!;
