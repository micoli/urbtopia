import { bridgeElevation, type ElevationAt } from './bridgeElevation';
import type { ModelLibrary } from './modelLibrary';
import { TRAIN_MODELS } from './renderItems';
import * as THREE from 'three';
import { modelFileOf } from '../core/models/modelFiles';
import { FLEET_VEHICLES, tileKey, type GameState, type TransitVehicleKind } from '../core';
import type { transitServices } from '../core/transit/transitService';

type Service = ReturnType<typeof transitServices>[number];

// A vehicle is two cars of 0.65 tile times its size, so the vehicles of one line are spread at least this far apart along the route.
export const VEHICLE_SPACING = 1.65;
// How much bigger than a bus a vehicle of each mode is drawn, and how far to the side it runs on a shared track.
export const MODE_LOOK = { rail: { size: 1.8, lane: 0.22 }, brt: { size: 1, lane: 0.16 } } as const;

// Distance between the centres of two cars of a vehicle, for a bus-sized one: a car is 0.65 tile long.
const CAR_PITCH = 0.7;

const VEHICLE_MODELS = Object.fromEntries(FLEET_VEHICLES.map(({ id, models }) => [id, models.map(modelFileOf)])) as Record<TransitVehicleKind, string[]>;

// Vehicles of one line are evenly spread along it; the ones that do not fit at the minimum spacing stay out of the picture.
export function slotOf(service: Pick<Service, 'route' | 'loop' | 'operatingVehicleIds'> & { mode: 'rail' | 'brt' }, vehicleId: number): { phase: number; hidden: boolean } {
  const cycle = (service.loop ? 1 : 2) * Math.max(0, (service.route?.length ?? 0) - 1);
  const slots = Math.max(1, Math.min(service.operatingVehicleIds.length, Math.floor(cycle / (VEHICLE_SPACING * MODE_LOOK[service.mode].size))));
  const order = Math.max(0, service.operatingVehicleIds.indexOf(vehicleId));
  return { phase: (order % slots) * cycle / slots, hidden: order >= slots };
}

interface RoutePose {
  x: number;
  z: number;
  yaw: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const edgeLength = (from: { x: number; y: number }, to: { x: number; y: number }): number => Math.max(1, Math.abs(to.x - from.x), Math.abs(to.y - from.y));

// The length of a route in tiles: a Bridge over infrastructure is one long edge between its ramps.
export function routeLength(route: readonly { x: number; y: number }[]): number {
  return route.slice(1).reduce((sum, tile, index) => sum + edgeLength(route[index]!, tile), 0);
}

// Where a car is on its route: `phase` runs along the route and, on a line that is not a loop, back along it.
export function poseAlong(route: readonly { x: number; y: number }[], loop: boolean, phase: number): RoutePose {
  const length = routeLength(route);
  const cycle = (loop ? 1 : 2) * length;
  const wrapped = ((phase % cycle) + cycle) % cycle;
  const returning = !loop && wrapped > length;
  const offset = returning ? 2 * length - wrapped : wrapped;
  let index = 0, start = 0;
  while (index < route.length - 2 && start + edgeLength(route[index]!, route[index + 1]!) <= offset) start += edgeLength(route[index]!, route[++index]!);
  const from = route[index]!, to = route[index + 1]!;
  const fraction = (offset - start) / edgeLength(from, to);
  const direction = returning ? -1 : 1;
  return { x: from.x + .5 + (to.x - from.x) * fraction, z: from.y + .5 + (to.y - from.y) * fraction, yaw: Math.atan2((to.x - from.x) * direction, (to.y - from.y) * direction), from, to };
}

export class TransitLayer {
  readonly root = new THREE.Group();
  readonly priorityTiles = new Set<string>();
  private tracks = new THREE.Group();
  private vehicles = new THREE.Group();
  private trackSignature = '';
  private fleetSignature = '';
  private moving: { mesh: THREE.Group; route: { x: number; y: number }[]; loop: boolean; phase: number; speed: number; brt: boolean; kind: TransitVehicleKind; hidden: boolean; lane: number; pitch: number }[] = [];
  private disposed = false;
  private modelsReady = false;
  private crossings = new Set<string>();

  constructor(private library?: ModelLibrary) {
    this.root.add(this.tracks, this.vehicles);
    if (!library) return;
    void library.ensure(TRAIN_MODELS).then(() => { if (this.disposed) return; this.modelsReady = true; this.fleetSignature = ''; for (const vehicle of this.moving) { vehicle.mesh.add(this.makeVehicle(vehicle.kind)); } this.update(0); });
  }

  sync(state: GameState, services: Service[]) {
    this.elevation = bridgeElevation(state.bridges);
    const trackSignature = JSON.stringify([state.brtRoads, state.rails]);
    this.crossings = new Set((state.brtRoads ?? []).filter(p => state.roads.some(r => tileKey(r) === tileKey(p))).map(tileKey));
    const tracksChanged = trackSignature !== this.trackSignature;
    if (tracksChanged) {
      this.trackSignature = trackSignature; this.clear(this.tracks);
    }
    if (tracksChanged) this.compactTracks();
    const fleetSignature = JSON.stringify([state.transitFleet, services.filter(l => l.mode !== 'bus').map(l => [l.id, l.active, l.loop, l.route, l.operatingVehicleIds])]);
    if (fleetSignature === this.fleetSignature) return;
    this.fleetSignature = fleetSignature; this.clear(this.vehicles); this.moving = []; this.priorityTiles.clear();
    for (const vehicle of state.transitFleet ?? []) {
      const service = services.find(l => l.id === vehicle.lineId);
      if (!service?.active || !service.route || !service.operatingVehicleIds.includes(vehicle.id)) continue;
      const mesh = new THREE.Group();
      mesh.add(this.makeVehicle(vehicle.kind));
      const look = MODE_LOOK[service.mode as 'rail' | 'brt'];
      const { phase, hidden } = slotOf({ ...service, mode: service.mode as 'rail' | 'brt' }, vehicle.id);
      mesh.visible = !hidden;
      this.vehicles.add(mesh);
      this.moving.push({ mesh, route: service.route, loop: !!service.loop, phase, hidden, speed: service.mode === 'rail' ? 2 : 1.5, brt: service.mode === 'brt', kind: vehicle.kind, lane: look.lane, pitch: CAR_PITCH * look.size });
    }
    this.update(0);
  }

  // Each car follows the route on its own, a pitch behind the one in front, so a long vehicle bends round the corners like an articulated bus.
  private elevation: ElevationAt = () => 0;

  update(delta: number) {
    this.priorityTiles.clear();
    for (const vehicle of this.moving) {
      const length = routeLength(vehicle.route);
      if (length < 1 || vehicle.hidden) continue;
      vehicle.phase = (vehicle.phase + Math.max(0, delta) * vehicle.speed) % ((vehicle.loop ? 1 : 2) * length);
      const cars = vehicle.mesh.children[0]?.children ?? [];
      const carCount = Math.max(cars.length, VEHICLE_MODELS[vehicle.kind].length);
      const side = vehicle.loop ? 0 : vehicle.lane;
      for (let index = 0; index < carCount; index++) {
        const pose = poseAlong(vehicle.route, vehicle.loop, vehicle.phase + vehicle.pitch * (0.5 - index));
        const car = cars[index];
        if (car) {
          car.position.set(pose.x + Math.cos(pose.yaw) * side, .12 + this.elevation(pose.x, pose.z, pose.from, pose.to), pose.z - Math.sin(pose.yaw) * side);
          car.rotation.y = pose.yaw;
        }
        if (vehicle.brt) for (const tile of [pose.from, pose.to]) if (this.crossings.has(tileKey(tile))) this.priorityTiles.add(tileKey(tile));
      }
    }
  }

  dispose() { this.disposed = true; this.clear(this.tracks); this.clear(this.vehicles); this.priorityTiles.clear(); }

  private compactTracks() {
    const groups = new Map<string, THREE.Mesh[]>();
    this.tracks.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      const geometry = node.geometry as THREE.BoxGeometry;
      const material = node.material as THREE.MeshStandardMaterial;
      const key = JSON.stringify([geometry.parameters, material.color.getHex()]);
      const group = groups.get(key) ?? []; group.push(node); groups.set(key, group);
    });
    const instances = [...groups.values()].map(meshes => {
      const first = meshes[0]!;
      const instanced = new THREE.InstancedMesh(first.geometry.clone(), (first.material as THREE.Material).clone(), meshes.length);
      for (let i = 0; i < meshes.length; i++) { meshes[i]!.updateMatrix(); instanced.setMatrixAt(i, meshes[i]!.matrix); }
      instanced.computeBoundingSphere();
      return instanced;
    });
    this.clear(this.tracks);
    if (instances.length) this.tracks.add(...instances);
    const stations = new THREE.Group(); stations.name = 'stations'; this.tracks.add(stations);
  }

  private makeVehicle(kind: TransitVehicleKind) {
    const size = MODE_LOOK[FLEET_VEHICLES.find(({ id }) => id === kind)?.mode ?? 'brt'].size;
    const group = new THREE.Group();
    if (!this.modelsReady || !this.library) return group;
    for (const key of VEHICLE_MODELS[kind]) {
      const model = this.library.get(key).clone(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const fitted = new THREE.Group();
      fitted.scale.setScalar(.65 * size / bounds.getSize(new THREE.Vector3()).z);
      model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
      fitted.add(model); group.add(fitted);
    }
    group.userData.sharedModel = true;
    return group;
  }

  private box(parent: THREE.Group, x: number, y: number, z: number, width: number, height: number, depth: number, color: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color }));
    mesh.position.set(x, y, z); parent.add(mesh);
  }

  private clear(group: THREE.Group) {
    group.traverse(node => { if (!(node instanceof THREE.Mesh)) return; let parent: THREE.Object3D | null = node; while (parent && parent !== group) { if (parent.userData.sharedModel) return; parent = parent.parent; } if (node instanceof THREE.InstancedMesh) node.dispose(); node.geometry.dispose(); const materials = Array.isArray(node.material) ? node.material : [node.material]; for (const material of materials) material.dispose(); });
    group.clear();
  }
}
