export interface PrototypeAssets {
  prototype: string;
  managed: string[];
}

// The 3D models each throwaway prototype loads. They are copied from the managed models, and never committed.
export const PROTOTYPE_ASSETS: PrototypeAssets[] = [
  {
    prototype: 'render-bench',
    managed: [
      'buildings/house-1x1-1f-tone-a', 'buildings/house-1x1-2f-mansard-a', 'buildings/house-1x1-3f-mansard-a', 'buildings/shop-construction-1x1-t1-tone-a',
      'buildings/shop-equipment-1x1-t1-tone-a', 'buildings/coal-1x1-t1-tone-a', 'buildings/watertower-1x1-t1-tone-a',
      'buildings/tower-1x1-4f-tone-a', 'buildings/tower-1x1-6f-tone-a', 'buildings/tower-1x1-8f-tone-a',
      'streets/road-crossroad', 'streets/road-straight',
    ],
  },
  {
    prototype: 'touch-ux',
    managed: [
      'buildings/factory-2x2-t1-tone-a', 'buildings/factory-2x2-t3-tone-a', 'buildings/shop-construction-1x1-t1-tone-a', 'buildings/house-1x1-1f-tone-a',
      'buildings/coal-1x1-t1-tone-a', 'buildings/watertower-1x1-t1-tone-a', 'streets/road-straight', 'streets/road-crossroad',
    ],
  },
];

export const PROTOTYPES_DIR = 'prototypes';
