import * as THREE from 'three';
import { energyStats, transportStats, footprintOf, type GameState } from '../core';
import { centerOf } from '../core/ecology';

export class EcologyLayer {
  readonly root = new THREE.Group();
  private busRoot = new THREE.Group();
  private overlay = new THREE.Group();
  private signs = new THREE.Group();
  private signature = '';
  private buses: { mesh: THREE.Group; route: { x: number; y: number; }[]; phase: number; }[] = [];
  private signTexture: THREE.CanvasTexture;
  private signMaterial: THREE.SpriteMaterial;
  private lineMaterial = new THREE.LineBasicMaterial({ color: 0x28ca8c });

  constructor() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1761ae'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BUS', 64, 88);
    this.signTexture = new THREE.CanvasTexture(canvas);
    this.signMaterial = new THREE.SpriteMaterial({ map: this.signTexture });
    this.root.add(this.busRoot, this.overlay, this.signs);
  }

  sync(state: GameState, selectedId: number | null) {
    const stats = transportStats(state);
    const signature = JSON.stringify({ stops: state.buildings.filter(b => b.type === 'busStop').map(b => [b.id, b.x, b.y]), lines: stats.lines.map(l => [l.id, l.active, l.route]) });
    if (signature !== this.signature) {
      this.signature = signature; this.clear(this.busRoot); this.clear(this.signs); this.buses = [];
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
      bus.mesh.position.set(a.x + .5 + (b.x - a.x) * f, .09, a.y + .5 + (b.y - a.y) * f);
      bus.mesh.rotation.y = Math.atan2(b.x - a.x, b.y - a.y) + (bus.phase > length ? Math.PI : 0);
    }
  }

  dispose() { this.clear(this.busRoot); this.clear(this.overlay); this.signTexture.dispose(); this.signMaterial.dispose(); this.lineMaterial.dispose(); }

  private path(points: { x: number; y: number ;}[]) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, .08, p.y)));
    this.overlay.add(new THREE.Line(geometry, this.lineMaterial));
  }

  private makeBus() {
    const bus = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(.28, .25, .72), new THREE.MeshStandardMaterial({ color: 0x1761ae })); body.position.y = .17; bus.add(body);
    const windows = new THREE.Mesh(new THREE.BoxGeometry(.285, .1, .54), new THREE.MeshStandardMaterial({ color: 0xbce6f5 })); windows.position.y = .22; bus.add(windows);
    for (const x of [-.14, .14]) for (const z of [-.22, .22]) { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .035, 10), new THREE.MeshStandardMaterial({ color: 0x24292b })); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .07, z); bus.add(wheel); }
    return bus;
  }

  private clear(group: THREE.Group) {
    for (const child of [...group.children]) {
      child.traverse(node => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); if (Array.isArray(node.material)) node.material.forEach(m => m.dispose()); else node.material.dispose(); } else if (node instanceof THREE.Line) node.geometry.dispose(); });
      group.remove(child);
    }
  }
}
