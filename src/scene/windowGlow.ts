import * as THREE from 'three';
import { WINDOW_SCHEDULE, type NightClock } from './windowSchedule';

const GLASS_HEX = 0x9fcdea;
const GLOW_HEX = 0xffc46b;
const GLOW_STRENGTH = 1.6;
const GLASS_TOLERANCE = 0.015;

// Shared by every patched material, so one assignment lights or darkens every window of the map.
const uniforms = {
  uWindowGlow: { value: 0 },
  uGlassColor: { value: new THREE.Color(GLASS_HEX) },
  uGlowColor: { value: new THREE.Color(GLOW_HEX).multiplyScalar(GLOW_STRENGTH) },
  uNightClock: { value: -1 },
  uNightIndex: { value: 0 },
};

const glsl = (value: number): string => value.toFixed(4);

const VERTEX_DECLARATIONS = 'varying vec3 vWindowWorld;\n';

const VERTEX_WORLD_POSITION = `
  vec4 windowWorld = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    windowWorld = instanceMatrix * windowWorld;
  #endif
  vWindowWorld = (modelMatrix * windowWorld).xyz;
`;

const FRAGMENT_DECLARATIONS = `varying vec3 vWindowWorld;
uniform float uWindowGlow;
uniform vec3 uGlassColor;
uniform vec3 uGlowColor;
uniform float uNightClock;
uniform int uNightIndex;

// The same integer hash as windowHash in windowSchedule.ts.
uint windowPcg(uint value) {
  uint state = value * 747796405u + 2891336053u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

uint windowHash(ivec3 cell) {
  uint hash = uint(uNightIndex);
  hash = windowPcg(hash ^ (uint(cell.x) * 73856093u));
  hash = windowPcg(hash ^ (uint(cell.y) * 19349663u));
  return windowPcg(hash ^ (uint(cell.z) * 83492791u));
}

float windowLit() {
  if (uNightClock < 0.0) return 0.0;
  ivec3 cell = ivec3(floor(vec3(vWindowWorld.x / ${glsl(WINDOW_SCHEDULE.cellWidth)}, vWindowWorld.y / ${glsl(WINDOW_SCHEDULE.cellHeight)}, vWindowWorld.z / ${glsl(WINDOW_SCHEDULE.cellWidth)})));
  uint hash = windowHash(cell);
  if (float(hash & 255u) / 255.0 >= ${glsl(WINDOW_SCHEDULE.usedShare)}) return 0.0;
  float on = float((hash >> 8u) & 255u) / 255.0 * ${glsl(WINDOW_SCHEDULE.latestOnHour)};
  float off = ${glsl(WINDOW_SCHEDULE.earliestOffHour)} + float((hash >> 16u) & 255u) / 255.0 * ${glsl(WINDOW_SCHEDULE.latestOffHour - WINDOW_SCHEDULE.earliestOffHour)};
  return step(on, uNightClock) * (1.0 - step(off, uNightClock));
}
`;

// The glass role of the building palette is one cell, so a pixel of that colour is a window pane.
const EMISSION = `
#ifdef USE_MAP
  float windowGlass = 1.0 - step(${GLASS_TOLERANCE.toFixed(3)}, distance(sampledDiffuseColor.rgb, uGlassColor));
  if (windowGlass > 0.5 && uWindowGlow > 0.0) totalEmissiveRadiance += uGlowColor * uWindowGlow * windowLit();
#endif
`;

export function patchWindowGlowVertexShader(vertexShader: string): string {
  return vertexShader
    .replace('void main() {', `${VERTEX_DECLARATIONS}void main() {`)
    .replace('#include <project_vertex>', `#include <project_vertex>${VERTEX_WORLD_POSITION}`);
}

export function patchWindowGlowShader(fragmentShader: string): string {
  return fragmentShader
    .replace('void main() {', `${FRAGMENT_DECLARATIONS}void main() {`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>${EMISSION}`);
}

export function setWindowNight(clock: NightClock): void {
  uniforms.uNightClock.value = clock.sinceDusk;
  uniforms.uNightIndex.value = clock.nightIndex;
}

export function setWindowGlow(level: number): void {
  uniforms.uWindowGlow.value = Math.min(1, Math.max(0, level));
}

export function windowNightClock(): number {
  return uniforms.uNightClock.value;
}

export function windowGlowLevel(): number {
  return uniforms.uWindowGlow.value;
}

function lightable(material: THREE.Material): material is THREE.MeshStandardMaterial {
  return (material as THREE.MeshStandardMaterial).isMeshStandardMaterial === true && (material as THREE.MeshStandardMaterial).map !== null;
}

// Returns copies, never the shared model materials: other layers draw the same models without glowing windows.
export function withWindowGlow(source: THREE.Material | THREE.Material[]): THREE.Material | THREE.Material[] {
  const patch = (material: THREE.Material): THREE.Material => {
    if (!lightable(material)) return material;
    const clone = material.clone();
    clone.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = patchWindowGlowVertexShader(shader.vertexShader);
      shader.fragmentShader = patchWindowGlowShader(shader.fragmentShader);
    };
    clone.customProgramCacheKey = () => 'window-glow';
    return clone;
  };
  return Array.isArray(source) ? source.map(patch) : patch(source);
}

export function isGlowingModel(model: string): boolean {
  return model.startsWith('buildings');
}
