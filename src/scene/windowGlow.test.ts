import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { isGlowingModel, patchWindowGlowShader, setWindowGlow, windowGlowLevel, withWindowGlow } from './windowGlow';

const FRAGMENT = 'void main() {\n  vec3 totalEmissiveRadiance = emissive;\n  #include <emissivemap_fragment>\n}';

describe('window glow', () => {
  it('adds the glass emission after the emissive map and declares its uniforms', () => {
    const patched = patchWindowGlowShader(FRAGMENT);
    expect(patched).toContain('uniform float uWindowGlow;');
    expect(patched.indexOf('uniform float uWindowGlow;')).toBeLessThan(patched.indexOf('void main() {'));
    expect(patched.indexOf('#include <emissivemap_fragment>')).toBeLessThan(patched.indexOf('totalEmissiveRadiance += uGlowColor'));
  });

  it('clamps the level of every window of the map', () => {
    setWindowGlow(2);
    expect(windowGlowLevel()).toBe(1);
    setWindowGlow(-1);
    expect(windowGlowLevel()).toBe(0);
    setWindowGlow(0.5);
    expect(windowGlowLevel()).toBe(0.5);
    setWindowGlow(0);
  });

  it('copies a textured standard material and leaves the original alone', () => {
    const original = new THREE.MeshStandardMaterial({ map: new THREE.Texture() });
    const lit = withWindowGlow(original) as THREE.MeshStandardMaterial;
    expect(lit).not.toBe(original);
    expect(lit.map).toBe(original.map);
    expect(lit.onBeforeCompile).not.toBe(original.onBeforeCompile);
    expect(lit.customProgramCacheKey()).toBe('window-glow');
  });

  it('keeps untextured and non-standard materials as they are', () => {
    const plain = new THREE.MeshStandardMaterial();
    const basic = new THREE.MeshBasicMaterial({ map: new THREE.Texture() });
    expect(withWindowGlow(plain)).toBe(plain);
    expect(withWindowGlow(basic)).toBe(basic);
  });

  it('handles material arrays', () => {
    const textured = new THREE.MeshStandardMaterial({ map: new THREE.Texture() });
    const plain = new THREE.MeshStandardMaterial();
    const result = withWindowGlow([textured, plain]) as THREE.Material[];
    expect(result[0]).not.toBe(textured);
    expect(result[1]).toBe(plain);
  });

  it('only lights building models', () => {
    expect(isGlowingModel('buildings-house-1x1-1f-tone-a')).toBe(true);
    expect(isGlowingModel('buildings/house-1x1-1f-tone-a')).toBe(true);
    expect(isGlowingModel('nature-tree')).toBe(false);
    expect(isGlowingModel('roads-straight')).toBe(false);
  });
});
