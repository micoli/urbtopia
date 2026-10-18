import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const PEDESTRIAN_COLOR = 0x2b2b2b;
export const BICYCLE_COLOR = 0x0d0d0d;

type Point = readonly [x: number, y: number, z: number];

// Points follow the Blender recipes (x forward, y side, z up); the game axes are z forward, x side, y up.
const toGame = ([forward, side, up]: Point): THREE.Vector3 => new THREE.Vector3(side, up, forward);

function bar(start: Point, end: Point, radius: number): THREE.BufferGeometry {
  const from = toGame(start);
  const to = toGame(end);
  const direction = to.clone().sub(from);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 6);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
  return geometry.translate(...from.add(to).multiplyScalar(0.5).toArray());
}

function ball(center: Point, radius: number): THREE.BufferGeometry {
  return new THREE.SphereGeometry(radius, 8, 6).translate(...toGame(center).toArray());
}

function wheel(forward: number): THREE.BufferGeometry {
  const radius = 0.06;
  return new THREE.TorusGeometry(radius, 0.004, 4, 14).rotateY(Math.PI / 2).translate(0, radius, forward);
}

function colored(geometries: THREE.BufferGeometry[], color: number): THREE.BufferGeometry {
  const merged = mergeGeometries(geometries) ?? geometries[0] ?? new THREE.BufferGeometry();
  const rgb = new THREE.Color(color);
  const colors = new Float32Array(merged.attributes.position!.count * 3);
  for (let i = 0; i < colors.length; i += 3) colors.set([rgb.r, rgb.g, rgb.b], i);
  merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return merged;
}

export function stickPedestrian(): THREE.BufferGeometry {
  return colored(
    [
      ball([0, 0, 0.275], 0.025),
      bar([0, 0, 0.255], [0, 0, 0.15], 0.006),
      bar([0, 0, 0.245], [0.04, 0, 0.17], 0.0048),
      bar([0, 0, 0.245], [-0.04, 0, 0.17], 0.0048),
      bar([0, 0, 0.15], [0.05, 0, 0], 0.006),
      bar([0, 0, 0.15], [-0.05, 0, 0], 0.006),
    ],
    PEDESTRIAN_COLOR,
  );
}

export function stickCyclist(): THREE.BufferGeometry {
  const rearHub: Point = [-0.13, 0, 0.06];
  const frontHub: Point = [0.13, 0, 0.06];
  const bottomBracket: Point = [0, 0, 0.045];
  const saddle: Point = [-0.035, 0, 0.115];
  const headTube: Point = [0.085, 0, 0.125];
  const hips: Point = [-0.04, 0, 0.125];
  const shoulder: Point = [0.03, 0, 0.215];
  const hands: Point = [0.09, 0, 0.145];
  const bicycle = colored(
    [
      wheel(-0.13),
      wheel(0.13),
      bar(bottomBracket, saddle, 0.0048),
      bar(saddle, headTube, 0.0048),
      bar(bottomBracket, headTube, 0.0048),
      bar(rearHub, bottomBracket, 0.0036),
      bar(rearHub, saddle, 0.0036),
      bar(frontHub, headTube, 0.0036),
      bar(headTube, hands, 0.0036),
      bar([0.09, -0.025, 0.145], [0.09, 0.025, 0.145], 0.0036),
    ],
    BICYCLE_COLOR,
  );
  const rider = colored(
    [
      bar(hips, shoulder, 0.006),
      ball([0.045, 0, 0.245], 0.022),
      bar(shoulder, hands, 0.0048),
      bar(hips, [0.02, 0, 0.07], 0.006),
      bar([0.02, 0, 0.07], [0, 0, 0.035], 0.006),
    ],
    PEDESTRIAN_COLOR,
  );
  return mergeGeometries([bicycle, rider]) ?? bicycle;
}
