import * as THREE from 'three';

const GLASS_HEX = 0x9fcdea;
const GLOW_HEX = 0xffc46b;
const GLOW_STRENGTH = 1.6;
const GLASS_TOLERANCE = 0.015;

// Shared by every patched material, so one assignment lights or darkens every window of the map.
const uniforms = {
  uWindowGlow: { value: 0 },
  uGlassColor: { value: new THREE.Color(GLASS_HEX) },
  uGlowColor: { value: new THREE.Color(GLOW_HEX).multiplyScalar(GLOW_STRENGTH) },
};

const UNIFORM_DECLARATIONS = 'uniform float uWindowGlow;\nuniform vec3 uGlassColor;\nuniform vec3 uGlowColor;\n';

// The glass role of the building palette is one cell, so a pixel of that colour is a window pane.
const EMISSION = `
#ifdef USE_MAP
  float windowGlass = 1.0 - step(${GLASS_TOLERANCE.toFixed(3)}, distance(sampledDiffuseColor.rgb, uGlassColor));
  totalEmissiveRadiance += uGlowColor * uWindowGlow * windowGlass;
#endif
`;

export function patchWindowGlowShader(fragmentShader: string): string {
  return fragmentShader
    .replace('void main() {', `${UNIFORM_DECLARATIONS}void main() {`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>${EMISSION}`);
}

export function setWindowGlow(level: number): void {
  uniforms.uWindowGlow.value = Math.min(1, Math.max(0, level));
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
