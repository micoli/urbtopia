export interface AssetPack {
  name: string;
  url: string;
  archive: string;
  files: string[];
}

// Kenney City Kits (CC0). The original archives are versioned in ARCHIVES_DIR, so installing and building never
// need the network. The URLs are only used by `npm run assets:fetch` to refresh them: they contain a hash that
// changes with each Kenney release, copy the new link from the pack page on https://kenney.nl/assets when it fails.
export const ASSET_PACKS: AssetPack[] = [
  {
    name: 'roads',
    url: 'https://kenney.nl/media/pages/assets/city-kit-roads/74288c9459-1787042796/kenney_city-kit-roads.zip',
    archive: 'kenney_city-kit-roads.zip',
    files: [
      'road-straight',
      'road-bend',
      'road-intersection',
      'road-crossroad',
      'road-end',
      'road-square',
      'road-crossing',
      'road-roundabout',
    ],
  },
  {
    name: 'commercial',
    url: 'https://kenney.nl/media/pages/assets/city-kit-commercial/a742d900eb-1753115042/kenney_city-kit-commercial_2.1.zip',
    archive: 'kenney_city-kit-commercial_2.1.zip',
    files: ['building-a'],
  },
  {
    name: 'suburban',
    url: 'https://kenney.nl/media/pages/assets/city-kit-suburban/2c871b7af2-1745479373/kenney_city-kit-suburban_20.zip',
    archive: 'kenney_city-kit-suburban_20.zip',
    files: ['building-type-a', 'building-type-b', 'building-type-f', 'building-type-h', 'building-type-k', 'building-type-n'],
  },
  {
    name: 'industrial',
    url: 'https://kenney.nl/media/pages/assets/city-kit-industrial/0ec35b139d-1788171848/kenney_city-kit-industrial_2.0.zip',
    archive: 'kenney_city-kit-industrial_2.0.zip',
    files: ['building-a', 'building-b', 'building-h', 'water-tower', 'windmill'],
  },
];

export const MODELS_DIR = 'public/models';
export const ARCHIVES_DIR = 'assets/kenney';
