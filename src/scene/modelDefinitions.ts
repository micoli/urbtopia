import definitions from '../../assets/models.json';

export type ModelSource = 'kenney' | 'quaternius' | 'managed' | 'poly.pizza';

export interface ModelDefinition {
  source: ModelSource;
  license: string;
  author?: string;
  url?: string;
  footprint?: [number, number];
  scale?: number;
  center?: [number, number];
  fit?: { width: number; height: number };
  rotationOffset?: number;
  bakeNodeScale?: boolean;
  recolor?: { color: string; variants?: Record<string, string> };
  note?: string;
}

export const MODEL_DEFINITIONS = definitions as unknown as Record<string, ModelDefinition>;

export const definitionOf = (key: string): ModelDefinition | undefined => MODEL_DEFINITIONS[key];

export function recolorOf(key: string, variant?: string): number | undefined {
  const recolor = definitionOf(key)?.recolor;
  const hex = variant ? recolor?.variants?.[variant] : recolor?.color;
  return hex ? Number.parseInt(hex.slice(1), 16) : undefined;
}
