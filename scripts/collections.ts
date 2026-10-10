import type { z } from 'zod';
import type { FlatBuilding } from '../src/core/buildings/buildingDefinition.ts';
import { BUILDING_ID_PATTERN, buildingSchema } from '../src/core/buildings/buildingSchema.ts';
import { ITEM_ID_PATTERN, goodSchema, materialSchema, type GoodDefinition, type MaterialDefinition } from '../src/core/economy/itemSchemas.ts';
import { cropSchema, type CropDefinition } from '../src/core/farming/cropSchema.ts';
import { boatSchema, type BoatDefinition } from '../src/core/water/boatSchema.ts';
import { serviceVehicleSchema, trafficVehicleSchema, transitVehicleSchema, type ServiceVehicleDefinition, type TrafficVehicleDefinition, type TransitVehicleDefinition } from '../src/core/transit/vehicleSchemas.ts';
import { fixtureSchema, type FixtureDefinition } from '../src/core/venues/fixtureSchema.ts';

// Every kind of Game object stored one file per id under assets/defs/<dir>. Pure: shared by the scripts, the build and the editor.

export interface Reference {
  // A Model id, or an id of one of these collections.
  target: 'models' | readonly string[];
  id: string;
  path: string;
}

export interface IdTypes {
  file: string;
  // Union type name → the ids it lists.
  unions: (definitions: Record<string, never>) => Record<string, string[]>;
}

export interface CollectionSpec {
  dir: string;
  title: string;
  schemaName: string;
  idTypes: IdTypes;
  schema: z.ZodType;
  idPattern: RegExp;
  idRule: string;
  // Written first, in this order; other fields follow in schema order.
  fieldOrder?: readonly string[];
  references: (definition: never) => Reference[];
}

const idsWhere = <T>(definitions: Record<string, T>, keep: (definition: T) => boolean = () => true) => Object.keys(definitions).filter(id => keep(definitions[id]!)).sort();

const goodReferences = (goods: Record<string, number> | undefined, path: string): Reference[] => Object.keys(goods ?? {}).map(id => ({ target: ['goods'], id, path: `${path}.${id}` }));

const modelReference = (id: string | undefined, path: string): Reference[] => (id ? [{ target: 'models', id, path }] : []);

export const COLLECTIONS = {
  buildings: {
    dir: 'buildings',
    title: 'Buildings',
    schemaName: 'building',
    idTypes: {
      file: 'src/core/buildings/buildingTypes.generated.ts',
      unions: (buildings: Record<string, FlatBuilding>) => ({
        BuildingId: idsWhere(buildings),
        SportVenueType: idsWhere(buildings, ({ kind }) => kind === 'sport'),
        NatureType: idsWhere(buildings, ({ kind }) => kind === 'nature'),
        StorageType: idsWhere(buildings, ({ kind }) => kind === 'storage'),
        FacilityType: idsWhere(buildings, ({ kind }) => kind === 'facility'),
        VenueType: idsWhere(buildings, ({ kind }) => kind === 'venue'),
      }),
    },
    schema: buildingSchema,
    idPattern: BUILDING_ID_PATTERN,
    idRule: 'start with a letter and use letters, digits or hyphens',
    fieldOrder: ['kind', 'order', 'retired', 'section', 'model', 'footprint', 'cost', 'unlockCitizens', 'requiresRoad', 'accessModes', 'initialSlots', 'name', 'description', 'radius', 'wellbeingBonus', 'family'],
    references: (building: FlatBuilding) => [
      ...modelReference(building.model, 'model'),
      ...modelReference(building.detailModel, 'detailModel'),
      ...(building.tiers ?? []).flatMap((tier, index) => [...modelReference(tier.model, `tiers.${index}.model`), ...goodReferences(tier.upgradeCost?.goods, `tiers.${index}.upgradeCost.goods`)]),
      ...Object.entries(building.variants ?? {}).flatMap(([name, { tiers }]) => tiers.flatMap((tier, index) => modelReference(tier.model, `variants.${name}.tiers.${index}.model`))),
      ...(['floor', 'wall', 'corner'] as const).flatMap(part => modelReference(building.shell?.[part], `shell.${part}`)),
      ...(building.staffModels ?? []).flatMap((model, index) => modelReference(model, `staffModels.${index}`)),
    ],
  },
  materials: {
    dir: 'materials',
    title: 'Materials',
    schemaName: 'material',
    idTypes: {
      file: 'src/core/economy/materialTypes.generated.ts',
      unions: (materials: Record<string, MaterialDefinition>) => ({
        DefinedMaterialId: idsWhere(materials),
        WorkshopMaterialId: idsWhere(materials, ({ producedBy }) => producedBy === 'workshop'),
      }),
    },
    schema: materialSchema,
    idPattern: ITEM_ID_PATTERN,
    idRule: 'be camelCase letters and digits',
    references: (material: MaterialDefinition) => modelReference(material.model, 'model'),
  },
  goods: {
    dir: 'goods',
    title: 'Goods',
    schemaName: 'good',
    idTypes: { file: 'src/core/economy/goodTypes.generated.ts', unions: (goods: Record<string, GoodDefinition>) => ({ BaseGoodId: idsWhere(goods) }) },
    schema: goodSchema,
    idPattern: ITEM_ID_PATTERN,
    idRule: 'be camelCase letters and digits',
    references: (good: GoodDefinition) => [...modelReference(good.model, 'model'), ...Object.keys(good.recipe ?? {}).map((id): Reference => ({ target: ['materials', 'crops'], id, path: `recipe.${id}` }))],
  },
  crops: {
    dir: 'crops',
    title: 'Crops',
    schemaName: 'crop',
    idTypes: { file: 'src/core/farming/cropTypes.generated.ts', unions: (crops: Record<string, CropDefinition>) => ({ CropId: idsWhere(crops) }) },
    schema: cropSchema,
    idPattern: ITEM_ID_PATTERN,
    idRule: 'be camelCase letters and digits',
    references: ({ models }: CropDefinition) => [
      ...(models?.growth ?? []).flatMap((id, stage) => modelReference(id, `models.growth.${stage}`)),
      ...modelReference(models?.produce, 'models.produce'),
      ...modelReference(models?.harvested, 'models.harvested'),
    ],
  },
  fixtures: {
    dir: 'fixtures',
    title: 'Fixtures',
    schemaName: 'fixture',
    idTypes: {
      file: 'src/core/venues/fixtureTypes.generated.ts',
      unions: (fixtures: Record<string, FixtureDefinition>) => ({
        FixtureId: idsWhere(fixtures),
        ArcadeFixtureId: idsWhere(fixtures, ({ venue }) => venue === 'arcade'),
        SupermarketFixtureId: idsWhere(fixtures, ({ venue }) => venue === 'supermarket'),
        HotelFixtureId: idsWhere(fixtures, ({ venue }) => venue === 'hotel'),
      }),
    },
    schema: fixtureSchema,
    idPattern: ITEM_ID_PATTERN,
    idRule: 'be camelCase letters and digits',
    fieldOrder: ['kind', 'order', 'venue', 'category'],
    references: (fixture: FixtureDefinition) => [...modelReference(fixture.model, 'model'), { target: ['buildings'], id: fixture.venue, path: 'venue' }],
  },
  boats: {
    dir: 'boats',
    title: 'Boats',
    schemaName: 'boat',
    idTypes: { file: 'src/core/water/boatTypes.generated.ts', unions: (boats: Record<string, BoatDefinition>) => ({ BoatId: idsWhere(boats) }) },
    schema: boatSchema,
    idPattern: ITEM_ID_PATTERN,
    idRule: 'be camelCase letters and digits',
    fieldOrder: ['kind', 'order', 'retired', 'family', 'model', 'cost', 'unlockCitizens'],
    references: (boat: BoatDefinition) => modelReference(boat.model, 'model'),
  },
  transitVehicles: {
    dir: 'transitVehicles',
    title: 'Transit vehicles',
    schemaName: 'transit-vehicle',
    idTypes: {
      file: 'src/core/transit/transitVehicleTypes.generated.ts',
      unions: (vehicles: Record<string, TransitVehicleDefinition>) => ({ TransitVehicleId: idsWhere(vehicles), FleetVehicleId: idsWhere(vehicles, ({ mode }) => mode !== 'bus') }),
    },
    schema: transitVehicleSchema,
    idPattern: ITEM_ID_PATTERN,
    idRule: 'be camelCase letters and digits',
    fieldOrder: ['kind', 'order', 'mode', 'propulsion', 'price', 'power', 'coal', 'cost', 'emissions', 'model', 'models'],
    references: (vehicle: TransitVehicleDefinition) => (vehicle.mode === 'bus' ? modelReference(vehicle.model, 'model') : vehicle.models.flatMap((model, index) => modelReference(model, `models.${index}`))),
  },
  trafficVehicles: {
    dir: 'trafficVehicles',
    title: 'Traffic vehicles',
    schemaName: 'traffic-vehicle',
    idTypes: { file: 'src/core/transit/trafficVehicleTypes.generated.ts', unions: (vehicles: Record<string, TrafficVehicleDefinition>) => ({ TrafficVehicleId: idsWhere(vehicles) }) },
    schema: trafficVehicleSchema,
    idPattern: ITEM_ID_PATTERN,
    idRule: 'be camelCase letters and digits',
    references: (vehicle: TrafficVehicleDefinition) => modelReference(vehicle.model, 'model'),
  },
  serviceVehicles: {
    dir: 'serviceVehicles',
    title: 'Service vehicles',
    schemaName: 'service-vehicle',
    idTypes: { file: 'src/core/transit/serviceVehicleTypes.generated.ts', unions: (vehicles: Record<string, ServiceVehicleDefinition>) => ({ ServiceVehicleId: idsWhere(vehicles) }) },
    schema: serviceVehicleSchema,
    idPattern: ITEM_ID_PATTERN,
    idRule: 'be camelCase letters and digits',
    fieldOrder: ['kind', 'order', 'facility', 'model'],
    references: (vehicle: ServiceVehicleDefinition) => [...modelReference(vehicle.model, 'model'), { target: ['buildings'], id: vehicle.facility, path: 'facility' } as Reference],
  },
} satisfies Record<string, CollectionSpec>;

export type CollectionName = keyof typeof COLLECTIONS;

export const COLLECTION_NAMES = Object.keys(COLLECTIONS) as CollectionName[];

export type Definition = Record<string, unknown>;

export type Collections = Record<CollectionName, Record<string, Definition>>;

export const specOf = (name: CollectionName): CollectionSpec => COLLECTIONS[name] as CollectionSpec;

const shapeKeys = (schema: z.ZodType): string[] => {
  const node = schema as unknown as { options?: z.ZodType[]; shape?: Record<string, unknown> };
  if (node.options) return [...new Set(node.options.flatMap(shapeKeys))];
  return Object.keys(node.shape ?? {});
};

export const fieldOrderOf = (name: CollectionName): string[] => {
  const spec = specOf(name);
  return [...new Set(['$schema', 'kind', 'order', ...(spec.fieldOrder ?? []), ...shapeKeys(spec.schema)])];
};
