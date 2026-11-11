import * as THREE from 'three';
import type { LinePath } from '../core';

// The top of a belt, and the half height of a Packet that stands on it.
const BELT_TOP = 0.42;
const PACKET_HEIGHT = 0.16;
const TILES_PER_SECOND = 0.55;
const SPACING = 1.3;

const BODY = new THREE.BoxGeometry(0.22, PACKET_HEIGHT, 0.2);
const TAPE = new THREE.BoxGeometry(0.03, 0.004, 0.2);
const BODY_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xc9a26b, roughness: 0.9 });
const TAPE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xe9dfc9, roughness: 0.6 });

interface Way {
  points: readonly THREE.Vector2[];
  length: number;
  packets: THREE.Object3D[];
  // Where the first Packet stands, as a share of the gap between two, so that the Packets of the ways of one Packer take them in turn.
  phase: number;
}

const lengthOf = (points: readonly THREE.Vector2[]): number => points.slice(1).reduce((total, point, index) => total + point.distanceTo(points[index]!), 0);

// Where a way is at a distance from its start, and which way it points there.
function pointAt(points: readonly THREE.Vector2[], distance: number): { at: THREE.Vector2; angle: number } {
  let left = distance;
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const segment = from.distanceTo(to);
    if (left <= segment || index === points.length - 1) {
      const along = segment === 0 ? 0 : Math.min(1, left / segment);
      return { at: from.clone().lerp(to, along), angle: Math.atan2(to.x - from.x, to.y - from.y) };
    }
    left -= segment;
  }
  return { at: points[0]!.clone(), angle: 0 };
}

// The Packets that ride the Line of a Packhouse interior, from the mouth of each Packer to the hatch of its Exit, one every so often. A picture only, never counted
// nor saved, still under reduced motion. Its pace follows the speed bonus of the floor.
export class InteriorLineLayer {
  readonly root = new THREE.Group();
  private ways: Way[] = [];
  private speed = 1;
  private time = 0;
  private calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  setPaths(paths: readonly LinePath[]): void {
    for (const child of [...this.root.children]) this.root.remove(child);
    const sharing = (path: LinePath): LinePath[] => paths.filter(other => other.source === path.source);
    this.ways = paths.filter(path => path.points.length > 1).map(path => {
      const points = path.points.map(point => new THREE.Vector2(point.x, point.y));
      const length = lengthOf(points);
      const siblings = sharing(path);
      const count = Math.max(1, Math.round(length / (SPACING * siblings.length)));
      const phase = siblings.indexOf(path) / siblings.length;
      const packets = Array.from({ length: count }, () => {
        const packet = new THREE.Mesh(BODY, BODY_MATERIAL);
        packet.add(new THREE.Mesh(TAPE, TAPE_MATERIAL).translateY(PACKET_HEIGHT / 2));
        this.root.add(packet);
        return packet;
      });
      return { points, length, packets, phase };
    });
    this.place();
  }

  // The pace of everything that moves, 1 with no bonus.
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  get active(): boolean {
    return !this.calm && this.ways.length > 0;
  }

  update(delta: number): void {
    if (this.calm) return;
    this.time += delta * this.speed * TILES_PER_SECOND;
    this.place();
  }

  private place(): void {
    for (const { points, length, packets, phase } of this.ways) {
      packets.forEach((packet, index) => {
        const { at, angle } = pointAt(points, (this.time + ((index + phase) * length) / packets.length) % length);
        packet.position.set(at.x, BELT_TOP + PACKET_HEIGHT / 2, at.y);
        packet.rotation.y = angle;
      });
    }
  }
}
