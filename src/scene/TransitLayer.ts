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

const VEHICLE_MODELS = Object.fromEntries(FLEET_VEHICLES.map(({ id, models }) => [id, models.map(modelFileOf)])) as Record<TransitVehicleKind, string[]>;

// Vehicles of one line are evenly spread along it; the ones that do not fit at the minimum spacing stay out of the picture.
export function slotOf(service: Pick<Service, 'route' | 'loop' | 'operatingVehicleIds'> & { mode: 'rail' | 'brt' }, vehicleId: number): { phase: number; hidden: boolean } {
  const cycle = (service.loop ? 1 : 2) * Math.max(0, (service.route?.length ?? 0) - 1);
  const slots = Math.max(1, Math.min(service.operatingVehicleIds.length, Math.floor(cycle / (VEHICLE_SPACING * MODE_LOOK[service.mode].size))));
  const order = Math.max(0, service.operatingVehicleIds.indexOf(vehicleId));
  return { phase: (order % slots) * cycle / slots, hidden: order >= slots };
}

export class TransitLayer {
  readonly root = new THREE.Group();
  readonly priorityTiles = new Set<string>();
  private tracks = new THREE.Group();
  private vehicles = new THREE.Group();
  private trackSignature = '';
  private fleetSignature = '';
  private moving: { mesh: THREE.Group; route: { x: number; y: number }[]; loop: boolean; phase: number; speed: number; brt: boolean; kind: TransitVehicleKind; hidden: boolean; lane: number }[] = [];
  private disposed = false;
  private modelsReady = false;
  private crossings = new Set<string>();

  constructor(private library?: ModelLibrary) {
    this.root.add(this.tracks, this.vehicles);
    if (!library) return;
    void library.ensure(TRAIN_MODELS).then(() => { if (this.disposed) return; this.modelsReady = true; this.fleetSignature = ''; for (const vehicle of this.moving) { vehicle.mesh.add(this.makeVehicle(vehicle.kind)); } });
  }

  sync(state: GameState, services: Service[]) {
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
      const mesh = this.makeVehicle(vehicle.kind);
      const look = MODE_LOOK[service.mode as 'rail' | 'brt'];
      const { phase, hidden } = slotOf({ ...service, mode: service.mode as 'rail' | 'brt' }, vehicle.id);
      mesh.visible = !hidden;
      this.vehicles.add(mesh);
      this.moving.push({ mesh, route: service.route, loop: !!service.loop, phase, hidden, speed: service.mode === 'rail' ? 2 : 1.5, brt: service.mode === 'brt', kind: vehicle.kind, lane: look.lane });
    }
    this.update(0);
  }

  update(delta: number) {
    this.priorityTiles.clear();
    for (const vehicle of this.moving) {
      const length = vehicle.route.length - 1;
      if (length < 1 || vehicle.hidden) continue;
      vehicle.phase = (vehicle.phase + Math.max(0, delta) * vehicle.speed) % ((vehicle.loop ? 1 : 2) * length);
      const returning = !vehicle.loop && vehicle.phase > length;
      const offset = returning ? 2 * length - vehicle.phase : vehicle.phase;
      const i = Math.min(length - 1, Math.floor(offset)), f = offset - i;
      const a = vehicle.route[i]!, b = vehicle.route[i + 1]!;
      const yaw = Math.atan2((b.x - a.x) * (returning ? -1 : 1), (b.y - a.y) * (returning ? -1 : 1));
      const side = vehicle.loop ? 0 : vehicle.lane;
      vehicle.mesh.position.set(a.x + .5 + (b.x - a.x) * f + Math.cos(yaw) * side, .12, a.y + .5 + (b.y - a.y) * f - Math.sin(yaw) * side);
      vehicle.mesh.rotation.y = yaw;
      if (vehicle.brt) for (const tile of [a, b]) if (this.crossings.has(tileKey(tile))) this.priorityTiles.add(tileKey(tile));
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
    for (const [index, key] of VEHICLE_MODELS[kind].entries()) {
      const model = this.library.get(key).clone(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const fitted = new THREE.Group();
      fitted.scale.setScalar(.65 * size / bounds.getSize(new THREE.Vector3()).z);
      model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
      fitted.position.z = (index === 0 ? .35 : -.35) * size; fitted.add(model); group.add(fitted);
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
