import type { ModelLibrary } from './modelLibrary';
import { TRAIN_MODELS } from './renderItems';
import * as THREE from 'three';
import { networkTiles, neighbour, tileKey, type GameState, type TransitVehicleKind } from '../core';
import type { transitServices } from '../core/transitService';

type Service = ReturnType<typeof transitServices>[number];

export class TransitLayer {
  readonly root = new THREE.Group();
  readonly priorityTiles = new Set<string>();
  private tracks = new THREE.Group();
  private vehicles = new THREE.Group();
  private trackSignature = '';
  private fleetSignature = '';
  private moving: { mesh: THREE.Group; route: { x: number; y: number }[]; phase: number; speed: number; brt: boolean; kind: TransitVehicleKind }[] = [];
  private disposed = false;
  private modelsReady = false;
  private crossings = new Set<string>();

  constructor(private library?: ModelLibrary) {
    this.root.add(this.tracks, this.vehicles);
    if (!library) return;
    void library.ensure(TRAIN_MODELS).then(() => { if (this.disposed) return; this.modelsReady = true; this.fleetSignature = ''; for (const vehicle of this.moving) { if (vehicle.kind !== 'brtElectric') vehicle.mesh.add(this.makeVehicle(vehicle.kind)); } });
  }

  sync(state: GameState, services: Service[]) {
    const trackSignature = JSON.stringify([state.brtRoads, state.rails, state.buildings.filter(b => ['brtStation', 'railStation'].includes(b.type)).map(b => [b.id, b.type, b.x, b.y, b.rotation])]);
    this.crossings = new Set((state.brtRoads ?? []).filter(p => state.roads.some(r => tileKey(r) === tileKey(p))).map(tileKey));
    const tracksChanged = trackSignature !== this.trackSignature;
    if (tracksChanged) {
      this.trackSignature = trackSignature; this.clear(this.tracks);
      for (const mode of ['brt'] as const) for (const tile of networkTiles(state, mode)) {
        this.box(this.tracks, tile.x + .5, .045, tile.y + .5, .94, .04, .94, 0x257cb5);
        for (const exit of tile.exits) {
          const next = neighbour(tile, exit);
          const x = (tile.x + next.x) / 2 + .5, z = (tile.y + next.y) / 2 + .5;
          const horizontal = next.x !== tile.x;
          this.box(this.tracks, x, .075, z, horizontal ? .5 : .035, .015, horizontal ? .035 : .5, 0xffdf76);
        }
      }
    }
    if (trackSignature === this.trackSignature && !this.tracks.getObjectByName('stations')) {
      const stations = new THREE.Group(); stations.name = 'stations'; this.tracks.add(stations);
      for (const stop of state.buildings.filter(b => ['brtStation', 'railStation'].includes(b.type))) {
        const rail = stop.type === 'railStation';
        this.box(stations, stop.x + (rail ? 1 : .5), .1, stop.y + .5, rail ? 1.8 : .85, .15, .85, rail ? 0x24c6a4 : 0x198de0);
        this.box(stations, stop.x + .5, .8, stop.y + .5, .06, 1.4, .06, 0xcbd5e1);
        this.box(stations, stop.x + .5, 1.5, stop.y + .5, .55, .3, .08, rail ? 0x24c6a4 : 0x198de0);
      }
    }
    if (tracksChanged) this.compactTracks();
    const fleetSignature = JSON.stringify([state.transitFleet, services.filter(l => l.mode !== 'bus').map(l => [l.id, l.active, l.route, l.operatingVehicleIds])]);
    if (fleetSignature === this.fleetSignature) return;
    this.fleetSignature = fleetSignature; this.clear(this.vehicles); this.moving = []; this.priorityTiles.clear();
    for (const vehicle of state.transitFleet ?? []) {
      const service = services.find(l => l.id === vehicle.lineId);
      if (!service?.active || !service.route || !service.operatingVehicleIds.includes(vehicle.id)) continue;
      const mesh = this.makeVehicle(vehicle.kind);
      this.vehicles.add(mesh);
      this.moving.push({ mesh, route: service.route, phase: vehicle.id % Math.max(1, 2 * (service.route.length - 1)), speed: service.mode === 'rail' ? 2 : 1.5, brt: service.mode === 'brt', kind: vehicle.kind });
    }
    this.update(0);
  }

  update(delta: number) {
    this.priorityTiles.clear();
    for (const vehicle of this.moving) {
      const length = vehicle.route.length - 1;
      if (length < 1) continue;
      vehicle.phase = (vehicle.phase + Math.max(0, delta) * vehicle.speed) % (2 * length);
      const returning = vehicle.phase > length;
      const offset = returning ? 2 * length - vehicle.phase : vehicle.phase;
      const i = Math.min(length - 1, Math.floor(offset)), f = offset - i;
      const a = vehicle.route[i]!, b = vehicle.route[i + 1]!;
      vehicle.mesh.position.set(a.x + .5 + (b.x - a.x) * f, .12, a.y + .5 + (b.y - a.y) * f);
      vehicle.mesh.rotation.y = Math.atan2((b.x - a.x) * (returning ? -1 : 1), (b.y - a.y) * (returning ? -1 : 1));
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
    this.clear(this.tracks); this.tracks.add(...instances);
    const stations = new THREE.Group(); stations.name = 'stations'; this.tracks.add(stations);
  }

  private makeVehicle(kind: TransitVehicleKind) {
    const group = new THREE.Group();
    if (kind !== 'brtElectric') {
      if (!this.modelsReady || !this.library) return group;
      const coal = kind === 'trainCoal';
      for (const [index, key] of (coal ? [TRAIN_MODELS[2]!, TRAIN_MODELS[3]!] : [TRAIN_MODELS[0]!, TRAIN_MODELS[1]!]).entries()) {
        const model = this.library.get(key).clone(true);
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const fitted = new THREE.Group();
        fitted.scale.setScalar(.65 / bounds.getSize(new THREE.Vector3()).z);
        model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
        fitted.position.z = index === 0 ? .35 : -.35; fitted.add(model); group.add(fitted);
      }
      group.userData.sharedModel = true;
      return group;
    }
    const color = 0x198de0;
    const parts = 2;
    for (let i = 0; i < parts; i++) {
      const z = (i - (parts - 1) / 2) * .42;
      this.box(group, 0, .2, z, .32, .32, .38, color);
      this.box(group, 0, .29, z, .34, .1, .26, 0xcdeaff);
      this.box(group, 0, .02, z, .38, .08, .25, 0x171e27);
    }
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
