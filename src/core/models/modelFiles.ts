import models from '../../../assets/models.json' with { type: 'json' };
import type { ModelEntry } from './modelSchema.ts';

export const MODEL_ENTRIES = Object.fromEntries(Object.entries(models).filter(([id]) => id !== '$schema')) as unknown as Record<string, ModelEntry>;

// Definitions refer to models by Model id; the scene loads and keys them by file.
export const modelFileOf = (id: string): string => MODEL_ENTRIES[id]?.file ?? id;
