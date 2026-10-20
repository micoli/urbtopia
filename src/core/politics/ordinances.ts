import { entriesOf } from '../defs/entries';
import ordinanceOrder from '../../../assets/defs/order/ordinances.json' with { type: 'json' };
import type { OrdinanceDefinition } from './ordinanceSchema';
import type { OrdinanceId } from './ordinanceTypes.generated';

export type { OrdinanceId };

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const files = import.meta.glob<OrdinanceDefinition>('../../../assets/defs/ordinances/*.json', { eager: true, import: 'default' });

export const ORDINANCE_ENTRIES = entriesOf<OrdinanceDefinition, OrdinanceId>(files, ordinanceOrder);

export const ordinanceById = (id: OrdinanceId): (typeof ORDINANCE_ENTRIES)[number] => ORDINANCE_ENTRIES.find(entry => entry.id === id)!;
