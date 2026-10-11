import { entriesOf } from '../defs/entries';
import transitOrder from '../../../assets/defs/order/transitVehicles.json' with { type: 'json' };
import trafficOrder from '../../../assets/defs/order/trafficVehicles.json' with { type: 'json' };
import serviceOrder from '../../../assets/defs/order/serviceVehicles.json' with { type: 'json' };
import { modelFileOf } from '../models/modelFiles';
import type { ServiceVehicleId } from './serviceVehicleTypes.generated';
import type { TrafficVehicleId } from './trafficVehicleTypes.generated';
import type { FleetVehicleId, TransitVehicleId } from './transitVehicleTypes.generated';
import type { ServiceVehicleDefinition, TrafficVehicleDefinition, TransitVehicleDefinition } from './vehicleSchemas';

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const transitFiles = import.meta.glob<TransitVehicleDefinition>('../../../assets/defs/transitVehicles/*.json', { eager: true, import: 'default' });
const trafficFiles = import.meta.glob<TrafficVehicleDefinition>('../../../assets/defs/trafficVehicles/*.json', { eager: true, import: 'default' });
const serviceFiles = import.meta.glob<ServiceVehicleDefinition>('../../../assets/defs/serviceVehicles/*.json', { eager: true, import: 'default' });

export const TRANSIT_VEHICLE_ENTRIES = entriesOf<TransitVehicleDefinition, TransitVehicleId>(transitFiles, transitOrder);

export type FleetVehicleEntry = Extract<(typeof TRANSIT_VEHICLE_ENTRIES)[number], { mode: 'brt' | 'rail' }> & { id: FleetVehicleId };

export const FLEET_VEHICLES = TRANSIT_VEHICLE_ENTRIES.filter((entry): entry is FleetVehicleEntry => entry.mode !== 'bus');

export const BUS_MODEL_FILE = modelFileOf(TRANSIT_VEHICLE_ENTRIES.find(entry => entry.mode === 'bus' && 'model' in entry)!.model!);

export const TRAFFIC_VEHICLE_ENTRIES = entriesOf<TrafficVehicleDefinition, TrafficVehicleId>(trafficFiles, trafficOrder);

export const SERVICE_VEHICLE_ENTRIES = entriesOf<ServiceVehicleDefinition, ServiceVehicleId>(serviceFiles, serviceOrder);
