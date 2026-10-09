import { MODEL_ENTRIES } from '../core/models/modelFiles';
import type { ModelEntry, ModelSource } from '../core/models/modelSchema';

export type { ModelSource };

// How the scene shows a model; the scene keys models by file.
export type ModelDefinition = Omit<ModelEntry, 'file'>;

const settingsOf = ({ file: _file, ...settings }: ModelEntry): ModelDefinition => settings;

export const MODEL_DEFINITIONS: Record<string, ModelDefinition> = Object.fromEntries(Object.values(MODEL_ENTRIES).map(entry => [entry.file, settingsOf(entry)]));

export const definitionOf = (file: string): ModelDefinition | undefined => MODEL_DEFINITIONS[file];

export function recolorOf(file: string, variant?: string): number | undefined {
  const recolor = definitionOf(file)?.recolor;
  const hex = variant ? recolor?.variants?.[variant] : recolor?.color;
  return hex ? Number.parseInt(hex.slice(1), 16) : undefined;
}
