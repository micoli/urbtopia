import * as THREE from 'three';
import { energyStats, transportStats, footprintOf, type GameState } from '../core';
import { centerOf } from '../core/ecology';
import type { ModelLibrary } from './modelLibrary';
import { poseOf } from './vehicleMotion';

const BUS_MODEL = 'trains/train-electric-subway-a';
const BUS_LENGTH = 0.72;

export class EcologyLayer {
  readonly root = new THREE.Group();
  private busRoot = new THREE.Group();
  private overlay = new THREE.Group();
  private signs = new THREE.Group();
  private signature = '';
  private disposed = false;
  private buses: { mesh: THREE.Group; route: { x: number; y: number; }[]; phase: number; }[] = [];
  private signTexture: THREE.CanvasTexture;
  private signMaterial: THREE.SpriteMaterial;
  private lineMaterial = new THREE.LineBasicMaterial({ color: 0x28ca8c });

  constructor(private library: ModelLibrary) {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1761ae'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BUS', 64, 88);
    this.signTexture = new THREE.CanvasTexture(canvas);
    this.signMaterial = new THREE.SpriteMaterial({ map: this.signTexture });
    this.root.add(this.busRoot, this.overlay, this.signs);
    void this.loadBusModel();
  }

  sync(state: GameState, selectedId: number | null) {
    const stats = transportStats(state);
    const signature = JSON.stringify({ stops: state.buildings.filter(b => b.type === 'busStop').map(b => [b.id, b.x, b.y]), lines: stats.lines.map(l => [l.id, l.active, l.route]) });
    if (signature !== this.signature) {
      this.signature = signature; this.busRoot.clear(); this.clear(this.signs); this.buses = [];
      for (const stop of state.buildings.filter(b => b.type === 'busStop')) {
        const sign = new THREE.Sprite(this.signMaterial); sign.position.set(stop.x + .5, 1.1, stop.y + .5); sign.scale.set(.55, .55, 1); this.signs.add(sign);
      }
      for (const line of stats.lines) {
        if (!line.active || !line.route) continue;
        const bus = this.makeBus(); this.busRoot.add(bus); this.buses.push({ mesh: bus, route: line.route, phase: line.id % 5 });
      }
    }
    this.clear(this.overlay);
    const selected = state.buildings.find(b => b.id === selectedId);
    if (!selected) return;
    const energy = energyStats(state);
    for (const transfer of energy.transfers.filter(x => x.from === selected.id || x.to === selected.id)) {
      const source = state.buildings.find(b => b.id === transfer.from), target = state.buildings.find(b => b.id === transfer.to);
      if (source && target) this.path([centerOf(source), centerOf(target)]);
    }
    const radius = selected.type === 'busStop' ? 6 : selected.type === 'battery' ? 8 : selected.type === 'park' ? 6 : selected.type === 'tree' ? 4 : selected.solar ? 6 : 0;
    if (radius) {
      const p = centerOf(selected);
      this.path([{ x: p.x - radius, y: p.y }, { x: p.x, y: p.y - radius }, { x: p.x + radius, y: p.y }, { x: p.x, y: p.y + radius }, { x: p.x - radius, y: p.y }]);
    }
    for (const line of stats.lines.filter(l => l.stops.includes(selected.id) && l.route)) this.path(line.route!);
    if (radius) for (const b of state.buildings.filter(b => b.type === 'home' || b.type === 'workshop' || b.type === 'factory' || b.type === 'shop')) {
      const p = centerOf(selected), q = centerOf(b); if (Math.abs(p.x - q.x) + Math.abs(p.y - q.y) > radius) continue;
      const f = footprintOf(b.type, b.rotation, b.tier);
      this.path([{ x: b.x, y: b.y }, { x: b.x + f.width, y: b.y }, { x: b.x + f.width, y: b.y + f.depth }, { x: b.x, y: b.y + f.depth }, { x: b.x, y: b.y }]);
    }
  }

  update(delta: number) {
    for (const bus of this.buses) {
      const length = bus.route.length - 1; if (length < 1) continue;
      bus.phase = (bus.phase + Math.max(0, delta) * 1.5) % (2 * length);
      const offset = bus.phase <= length ? bus.phase : 2 * length - bus.phase;
      const index = Math.min(length - 1, Math.floor(offset)), f = offset - index, a = bus.route[index]!, b = bus.route[index + 1]!;
      const returning = bus.phase > length;
      const from = returning ? b : a, to = returning ? a : b;
      const previous = bus.route[returning ? index + 2 : index - 1];
      const heading = previous ? { x: from.x - previous.x, y: from.y - previous.y } : { x: to.x - from.x, y: to.y - from.y };
      const pose = poseOf({ from, to, heading, progress: returning ? 1 - f : f, model: 0, speed: 1.5 });
      bus.mesh.position.set(pose.x, .09, pose.z);
      bus.mesh.rotation.y = pose.yaw;
    }
  }

  dispose() { this.disposed = true; this.busRoot.clear(); this.clear(this.overlay); this.signTexture.dispose(); this.signMaterial.dispose(); this.lineMaterial.dispose(); }

  private path(points: { x: number; y: number ;}[]) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, .08, p.y)));
    this.overlay.add(new THREE.Line(geometry, this.lineMaterial));
  }

  private async loadBusModel(): Promise<void> {
    await this.library.ensure([BUS_MODEL]);
    if (this.disposed) return;
    for (const bus of this.buses) {
      if (bus.mesh.children.length === 0) bus.mesh.add(this.createBusModel());
    }
  }

  private makeBus() {
    const bus = new THREE.Group();
    if (this.library.has(BUS_MODEL)) bus.add(this.createBusModel());
    return bus;
  }

  private createBusModel(): THREE.Object3D {
    const model = this.library.get(BUS_MODEL).clone(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = BUS_LENGTH / bounds.getSize(new THREE.Vector3()).z;
    const fitted = new THREE.Group();
    fitted.scale.setScalar(scale);
    model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
    fitted.add(model);
    return fitted;
  }

  private clear(group: THREE.Group) {
    for (const child of [...group.children]) {
      child.traverse(node => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); if (Array.isArray(node.material)) node.material.forEach(m => m.dispose()); else node.material.dispose(); } else if (node instanceof THREE.Line) node.geometry.dispose(); });
      group.remove(child);
    }
  }
}
