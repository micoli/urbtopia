import { isShopType } from '../core/economy/shops';
import { TransitLayer } from './TransitLayer';
import * as THREE from 'three';
import { energyStats, greenProfileOf, transportStats, footprintOf, type GameState, isHomeType } from '../core';
import { centerOf } from '../core/environment/ecology';
import type { ModelLibrary } from './modelLibrary';

export class EcologyLayer {
  readonly transit: TransitLayer;
  readonly root = new THREE.Group();
  private overlay = new THREE.Group();
  private lineMaterial = new THREE.LineBasicMaterial({ color: 0x28ca8c });

  constructor(library: ModelLibrary) {
    this.transit = new TransitLayer(library);
    this.root.add(this.overlay, this.transit.root);
  }

  sync(state: GameState, selectedId: number | null) {
    const stats = transportStats(state);
    this.transit.sync(state, stats.lines);
    this.clear(this.overlay);
    const selected = state.buildings.find(b => b.id === selectedId);
    if (!selected) return;
    const energy = energyStats(state);
    for (const transfer of energy.transfers.filter(x => x.from === selected.id || x.to === selected.id)) {
      const source = state.buildings.find(b => b.id === transfer.from), target = state.buildings.find(b => b.id === transfer.to);
      if (source && target) this.path([centerOf(source), centerOf(target)]);
    }
    const radius = ['busStop', 'brtStation', 'railStation'].includes(selected.type) ? 6 : selected.type === 'battery' ? 8 : greenProfileOf(selected.type, selected.tier)?.radius ?? (selected.solar ? 6 : 0);
    for (const line of stats.lines.filter(l => l.stops.includes(selected.id) && l.route)) this.path(line.route!);
    if (radius) for (const b of state.buildings.filter(b => isHomeType(b.type) || b.type === 'workshop' || b.type === 'factory' || isShopType(b.type))) {
      const p = centerOf(selected), q = centerOf(b); if (Math.abs(p.x - q.x) + Math.abs(p.y - q.y) > radius) continue;
      const f = footprintOf(b.type, b.rotation, b.tier);
      this.path([{ x: b.x, y: b.y }, { x: b.x + f.width, y: b.y }, { x: b.x + f.width, y: b.y + f.depth }, { x: b.x, y: b.y + f.depth }, { x: b.x, y: b.y }]);
    }
  }

  update(delta: number) {
    this.transit.update(delta);
  }

  dispose() { this.transit.dispose(); this.clear(this.overlay); this.lineMaterial.dispose(); }

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
