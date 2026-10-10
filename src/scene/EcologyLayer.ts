import { isShopType } from '../core/economy/shops';
import { TransitLayer } from './TransitLayer';
import * as THREE from 'three';
import { energyStats, greenProfileOf, transportStats, footprintOf, type GameState } from '../core';
import { centerOf } from '../core/environment/ecology';
import type { ModelLibrary } from './modelLibrary';

export class EcologyLayer {
  readonly transit: TransitLayer;
  readonly root = new THREE.Group();
  private overlay = new THREE.Group();
  private signs = new THREE.Group();
  private signature = '';
  private signTexture: THREE.CanvasTexture;
  private signMaterial: THREE.SpriteMaterial;
  private lineMaterial = new THREE.LineBasicMaterial({ color: 0x28ca8c });

  constructor(library: ModelLibrary) {
    this.transit = new TransitLayer(library);
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1761ae'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BUS', 64, 88);
    this.signTexture = new THREE.CanvasTexture(canvas);
    this.signMaterial = new THREE.SpriteMaterial({ map: this.signTexture });
    this.root.add(this.overlay, this.signs, this.transit.root);
  }

  sync(state: GameState, selectedId: number | null) {
    const stats = transportStats(state);
    this.transit.sync(state, stats.lines);
    const signature = JSON.stringify({ stops: state.buildings.filter(b => b.type === 'busStop').map(b => [b.id, b.x, b.y]), lines: stats.lines.map(l => [l.id, l.active, l.route]) });
    if (signature !== this.signature) {
      this.signature = signature; this.clear(this.signs);
      for (const stop of state.buildings.filter(b => b.type === 'busStop')) {
        const sign = new THREE.Sprite(this.signMaterial); sign.position.set(stop.x + .5, 1.1, stop.y + .5); sign.scale.set(.55, .55, 1); this.signs.add(sign);
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
    const radius = ['busStop', 'brtStation', 'railStation'].includes(selected.type) ? 6 : selected.type === 'battery' ? 8 : greenProfileOf(selected.type)?.radius ?? (selected.solar ? 6 : 0);
    if (radius) {
      const p = centerOf(selected);
      this.path([{ x: p.x - radius, y: p.y }, { x: p.x, y: p.y - radius }, { x: p.x + radius, y: p.y }, { x: p.x, y: p.y + radius }, { x: p.x - radius, y: p.y }]);
    }
    for (const line of stats.lines.filter(l => l.stops.includes(selected.id) && l.route)) this.path(line.route!);
    if (radius) for (const b of state.buildings.filter(b => b.type === 'home' || b.type === 'workshop' || b.type === 'factory' || isShopType(b.type))) {
      const p = centerOf(selected), q = centerOf(b); if (Math.abs(p.x - q.x) + Math.abs(p.y - q.y) > radius) continue;
      const f = footprintOf(b.type, b.rotation, b.tier);
      this.path([{ x: b.x, y: b.y }, { x: b.x + f.width, y: b.y }, { x: b.x + f.width, y: b.y + f.depth }, { x: b.x, y: b.y + f.depth }, { x: b.x, y: b.y }]);
    }
  }

  update(delta: number) {
    this.transit.update(delta);
  }

  dispose() { this.transit.dispose(); this.clear(this.overlay); this.signTexture.dispose(); this.signMaterial.dispose(); this.lineMaterial.dispose(); }

  private path(points: { x: number; y: number ;}[]) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, .08, p.y)));
    this.overlay.add(new THREE.Line(geometry, this.lineMaterial));
  }

  private clear(group: THREE.Group) {
    for (const child of [...group.children]) {
      child.traverse(node => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); if (Array.isArray(node.material)) node.material.forEach(m => m.dispose()); else node.material.dispose(); } else if (node instanceof THREE.Line) node.geometry.dispose(); });
      group.remove(child);
    }
  }
}
