export type Selection = string[] | 'all';

export interface PrototypeAssets {
  prototype: string;
  packs: Record<string, Selection>;
  managed?: string[];
}

const letters = (first: string, last: string) =>
  Array.from({ length: last.charCodeAt(0) - first.charCodeAt(0) + 1 }, (_, index) => String.fromCharCode(first.charCodeAt(0) + index));

// The 3D models each throwaway prototype loads. They are copied from the versioned Kenney archives and the managed models, and never committed.
export const PROTOTYPE_ASSETS: PrototypeAssets[] = [
  {
    prototype: 'render-bench',
    packs: {
      commercial: [
        ...letters('a', 'n').map((letter) => `building-${letter}`),
        ...letters('a', 'e').map((letter) => `building-skyscraper-${letter}`),
        ...letters('a', 'n').map((letter) => `low-detail-building-${letter}`),
      ],
    },
    managed: ['streets/road-crossroad', 'streets/road-straight'],
  },
  {
    prototype: 'touch-ux',
    packs: {
      industrial: ['building-a', 'building-h', 'building-t', 'water-tower'],
      commercial: ['building-a'],
      suburban: ['building-type-a'],
    },
    managed: ['streets/road-straight', 'streets/road-crossroad'],
  },
];

export const PROTOTYPES_DIR = 'prototypes';

