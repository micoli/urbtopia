import * as THREE from 'three';
import type { Coord } from '../core';

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

const PAD_HEIGHT = 0.06;
const BEAM_HEIGHT = 1.4;
const BEAM_WIDTH = 0.1;
const PULSE_SPEED = 3;

// A pulsing glow on the ground and a thin beam of light over each place to find on the map.
export class HighlightLayer {
  readonly root = new THREE.Group();
  private pad: THREE.MeshBasicMaterial;
  private beam: THREE.MeshBasicMaterial;
  private padGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  private beamGeometry = new THREE.BoxGeometry(BEAM_WIDTH, BEAM_HEIGHT, BEAM_WIDTH);
  private meshes: THREE.Mesh[] = [];
  private time = 0;

  constructor(color: number) {
    const material = (opacity: number) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
    this.pad = material(0.4);
    this.beam = material(0.35);
    this.root.visible = false;
  }

  set(rects: readonly HighlightRect[]): void {
    for (const mesh of this.meshes) this.root.remove(mesh);
    this.meshes = rects.flatMap(({ x, y, width, depth }) => {
      const pad = new THREE.Mesh(this.padGeometry, this.pad);
      pad.scale.set(width, 1, depth);
      pad.position.set(x + width / 2, PAD_HEIGHT, y + depth / 2);
      const beam = new THREE.Mesh(this.beamGeometry, this.beam);
      beam.position.set(x + width / 2, BEAM_HEIGHT / 2, y + depth / 2);
      return [pad, beam];
    });
    this.root.add(...this.meshes);
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  update(delta: number): void {
    if (!this.root.visible) return;
    this.time += delta;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * PULSE_SPEED);
    this.pad.opacity = 0.25 + 0.3 * pulse;
    this.beam.opacity = 0.2 + 0.25 * pulse;
  }

  dispose(): void {
    this.padGeometry.dispose();
    this.beamGeometry.dispose();
    this.pad.dispose();
    this.beam.dispose();
  }
}

export const tileRect = (tile: Coord): HighlightRect => ({ x: tile.x, y: tile.y, width: 1, depth: 1 });
