import { NATURE_MODELS } from '../src/core/environment/nature.ts';
import { CROP_IDS } from '../src/core/farming/crops.ts';
import { cropModelsOf } from '../src/scene/cropModels.ts';
import { existsSync, readFileSync } from 'node:fs';
import type { QuaterniusPack } from './quaternius.ts';

const natureFiles = (pack: string) => NATURE_MODELS.filter(([, model]) => model.startsWith(`${pack}/`)).map(([, model]) => model.slice(pack.length + 1));

export interface AssetPack {
  name: string;
  url: string;
  archive: string;
  files: string[];
  colormap?: boolean;
  colorVariants?: boolean;
}

// Kenney asset packs (CC0). The original archives are versioned in ARCHIVES_DIR, so installing and building never
// need the network. The URLs are only used by `npm run assets:fetch` to refresh them: they contain a hash that
// changes with each Kenney release, copy the new link from the pack page on https://kenney.nl/assets when it fails.
export const EXTRA_PACKS_FILE = 'assets/extra-packs.json';

export interface ExtraPacks {
  kenney: { name: string; archive: string; colormap: boolean }[];
  quaternius: { name: string; archive: string }[];
}

// Packs added with tools/assets-editor: the archive is listed for browsing, none of its models is installed for the game.
export const readExtraPacks = (file = EXTRA_PACKS_FILE): ExtraPacks => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { kenney: [], quaternius: [] });

const extraPacks = readExtraPacks();

export const ASSET_PACKS: AssetPack[] = [
  {
    name: 'roads',
    colorVariants: true,
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
      'road-sign-empty',
    ],
  },
  {
    name: 'commercial',
    url: 'https://kenney.nl/media/pages/assets/city-kit-commercial/a742d900eb-1753115042/kenney_city-kit-commercial_2.1.zip',
    archive: 'kenney_city-kit-commercial_2.1.zip',
    files: ['building-a', 'building-b', 'building-d', 'building-f', 'building-g', 'building-i', 'building-j', 'building-k', 'building-l', 'building-n', 'detail-awning', 'detail-awning-wide', 'detail-overhang', 'detail-overhang-wide', 'detail-parasol-a', 'detail-parasol-b'],
  },
  {
    name: 'suburban',
    colorVariants: true,
    url: 'https://kenney.nl/media/pages/assets/city-kit-suburban/2c871b7af2-1745479373/kenney_city-kit-suburban_20.zip',
    archive: 'kenney_city-kit-suburban_20.zip',
    files: ['building-type-a', 'building-type-b', 'building-type-f', 'building-type-h', 'building-type-k', 'building-type-m', 'building-type-n', 'building-type-t', 'building-type-j', 'building-type-u', 'tree-small', 'tree-large'],
  },
  {
    name: 'industrial',
    url: 'https://kenney.nl/media/pages/assets/city-kit-industrial/0ec35b139d-1788171848/kenney_city-kit-industrial_2.0.zip',
    archive: 'kenney_city-kit-industrial_2.0.zip',
    files: ['building-a', 'building-b', 'building-c', 'building-e', 'building-f', 'building-h', 'building-l', 'building-p', 'building-q', 'building-s', 'water-tower', 'windmill', 'chimney-basic', 'chimney-small', 'chimney-medium', 'chimney-large', 'building-d', 'shipping-container-a', 'solar-panel-flat', 'solar-panel-landscape', 'solar-panel-landscape-group'],
  },
  {
    name: 'cars',
    url: 'https://kenney.nl/media/pages/assets/car-kit/1a312ec241-1775131960/kenney_car-kit.zip',
    archive: 'kenney_car-kit.zip',
    files: ['sedan', 'sedan-sports', 'hatchback-sports', 'suv', 'suv-luxury', 'taxi', 'van', 'ambulance', 'firetruck', 'police'],
  },
  {
    name: 'nature',
    colormap: false,
    url: 'https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip',
    archive: 'kenney_nature-kit.zip',
    files: natureFiles('nature'),
  },
  {
    name: 'mini-forest',
    url: 'https://kenney.nl/media/pages/assets/mini-forest/44a89aed7f-1784024079/kenney_mini-forest_1.0.zip',
    archive: 'kenney_mini-forest_1.0.zip',
    files: natureFiles('mini-forest'),
  },
  {
    name: 'graveyard',
    url: 'https://kenney.nl/media/pages/assets/graveyard-kit/ba8d4b4517-1760691807/kenney_graveyard-kit_5.0.zip',
    archive: 'kenney_graveyard-kit_5.0.zip',
    files: [],
  },
  {
    name: 'holiday',
    url: 'https://kenney.nl/media/pages/assets/holiday-kit/3976a6496a-1733923970/kenney_holiday-kit.zip',
    archive: 'kenney_holiday-kit.zip',
    files: natureFiles('holiday'),
  },
  {
    name: 'pirate',
    url: 'https://kenney.nl/media/pages/assets/pirate-kit/e6d4bb1525-1771333093/kenney_pirate-kit.zip',
    archive: 'kenney_pirate-kit.zip',
    files: natureFiles('pirate'),
  },
  {
    name: 'watercraft',
    url: 'https://kenney.nl/media/pages/assets/watercraft-kit/a335cfed49-1713519620/kenney_watercraft-pack.zip',
    archive: 'kenney_watercraft-pack.zip',
    files: ['boat-house-a', 'boat-sail-a', 'boat-fishing-small', 'ship-ocean-liner-small'],
  },
  {
    name: 'trains',
    url: 'https://kenney.nl/media/pages/assets/train-kit/cf8521d625-1727040883/kenney_train-kit.zip',
    archive: 'kenney_train-kit.zip',
    files: ['train-electric-subway-a', 'railroad-straight', 'railroad-corner-small', 'train-electric-city-a', 'train-electric-city-b', 'train-electric-city-c', 'train-locomotive-a', 'train-locomotive-passenger-a'],
  },
  {
    name: 'mini-arcade',
    url: 'https://kenney.nl/media/pages/assets/mini-arcade/ece1e8f320-1721638600/kenney_mini-arcade.zip',
    archive: 'kenney_mini-arcade.zip',
    files: ['arcade-machine', 'floor', 'wall', 'wall-corner', 'air-hockey', 'basketball-game', 'cash-register', 'claw-machine', 'dance-machine', 'pinball', 'prize-wheel', 'ticket-machine', 'vending-machine', 'character-gamer', 'character-employee', 'wall-window'],
  },
  {
    name: 'mini-market',
    url: 'https://kenney.nl/media/pages/assets/mini-market/463f38da51-1729865423/kenney_mini-market.zip',
    archive: 'kenney_mini-market.zip',
    files: ['cash-register', 'shelf-bags', 'shelf-boxes', 'display-bread', 'display-fruit', 'freezer', 'freezers-standing', 'shopping-basket', 'shopping-cart', 'bottle-return', 'floor', 'wall', 'wall-corner', 'wall-window'],
  },
  {
    name: 'furniture',
    colormap: false,
    url: 'https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip',
    archive: 'kenney_furniture-kit.zip',
    files: ['table', 'chair', 'stoolBar', 'desk', 'bedSingle', 'bedDouble', 'bedBunk', 'toilet', 'shower', 'bathtub', 'loungeSofa', 'televisionModern', 'lampRoundFloor', 'rugRectangle', 'pottedPlant', 'kitchenCoffeeMachine', 'kitchenFridgeSmall', 'floorFull', 'wall', 'wallCorner', 'wallWindow'],
  },
  ...extraPacks.kenney.map(({ name, archive, colormap }) => ({ name, url: '', archive, files: [], colormap })),
];

// Quaternius packs (CC0) ship FBX only: they are converted to GLB at install time so the runtime keeps one GLTF loader.
export const QUATERNIUS_PACKS: QuaterniusPack[] = [
  { name: 'crops', archive: 'crops.zip', files: CROP_IDS.flatMap((species) => cropModelsOf(species)).map((model) => model.slice('crops/'.length)) },
  { name: 'farm', archive: 'farm-buildings.zip', files: ['Barn', 'OpenBarn', 'Silo_House', 'Silo'] },
  { name: 'buildings', archive: 'buildings.zip', files: ['2Story_Stairs_Mat', '2Story_Wide_Mat', '2Story_Wide_2Doors_Mat'] },
  ...extraPacks.quaternius.map(({ name, archive }) => ({ name, archive, files: [] })),
];

export const QUATERNIUS_ARCHIVES_DIR = 'assets/quaternus';
export const MODELS_DIR = 'public/models';
export const ARCHIVES_DIR = 'assets/kenney';
export const POLY_PIZZA_LIST_ID = 'Ml5TEydHhn';
export const POLY_PIZZA_DIR = 'assets/poly.pizza';
export const MANAGED_MODELS_DIR = 'assets/managed-models';
