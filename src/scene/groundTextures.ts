import * as THREE from 'three';
import { nextRandom } from '../core';

const WILD_TILES = 16;
const TENDED_TILES = 2;
const PIXELS_PER_TILE = 64;

type Draw = (context: CanvasRenderingContext2D, size: number, random: () => number) => void;

function makeRandom(seed: number): () => number {
  let state = seed;
  return () => {
    const next = nextRandom(state);
    state = next.rngState;
    return next.value;
  };
}

function paint(size: number, seed: number, draw: Draw): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) draw(context, size, makeRandom(seed));
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function scatter(size: number, random: () => number, count: number, shapes: (x: number, y: number) => void): void {
  for (let i = 0; i < count; i++) shapes(random() * size, random() * size);
}

function wrapped(size: number, x: number, y: number, radius: number, draw: (x: number, y: number) => void): void {
  for (const dx of [-size, 0, size]) {
    for (const dy of [-size, 0, size]) {
      if (x + dx < -radius || x + dx > size + radius || y + dy < -radius || y + dy > size + radius) continue;
      draw(x + dx, y + dy);
    }
  }
}

const drawWild: Draw = (context, size, random) => {
  context.fillStyle = '#6c9156';
  context.fillRect(0, 0, size, size);
  const tones = ['108, 145, 86', '98, 134, 78', '118, 156, 94', '104, 138, 80', '124, 150, 90'];
  for (const [count, minRadius, maxRadius, alpha] of [
    [90, 90, 200, 0.22],
    [380, 30, 90, 0.2],
    [900, 8, 30, 0.16],
  ] as const) {
    scatter(size, random, count, (x, y) => {
      const radius = minRadius + random() * (maxRadius - minRadius);
      const tone = tones[Math.floor(random() * tones.length)] ?? tones[0]!;
      wrapped(size, x, y, radius, (px, py) => {
        const gradient = context.createRadialGradient(px, py, 0, px, py, radius);
        gradient.addColorStop(0, `rgba(${tone}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${tone}, 0)`);
        context.fillStyle = gradient;
        context.fillRect(px - radius, py - radius, radius * 2, radius * 2);
      });
    });
  }
  const flowers = ['#f2e6a0', '#f4f0ea', '#e0a3bd'];
  scatter(size, random, 70, (x, y) => {
    context.fillStyle = flowers[Math.floor(random() * flowers.length)] ?? flowers[0]!;
    wrapped(size, x, y, 4, (px, py) => context.fillRect(px, py, 3, 3));
  });
  scatter(size, random, 40, (x, y) => {
    context.fillStyle = random() > 0.5 ? '#8c8f86' : '#a3a699';
    wrapped(size, x, y, 8, (px, py) => {
      context.beginPath();
      context.ellipse(px, py, 3 + random() * 3, 2 + random() * 2, random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    });
  });
};

const drawTended: Draw = (context, size, random) => {
  const half = size / TENDED_TILES;
  for (let row = 0; row < TENDED_TILES; row++) {
    for (let column = 0; column < TENDED_TILES; column++) {
      context.fillStyle = (row + column) % 2 === 0 ? '#9ccb76' : '#8fc16a';
      context.fillRect(column * half, row * half, half, half);
    }
  }
  context.globalAlpha = 0.4;
  scatter(size, random, 700, (x, y) => {
    context.fillStyle = random() > 0.5 ? '#b3dc8c' : '#7aab57';
    wrapped(size, x, y, 2, (px, py) => context.fillRect(px, py, 2, 2));
  });
  context.globalAlpha = 0.25;
  context.strokeStyle = '#6f9c4f';
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, size - 1, size - 1);
  context.globalAlpha = 1;
};

export function createWildGroundTexture(): THREE.CanvasTexture {
  return paint(WILD_TILES * PIXELS_PER_TILE, 1, drawWild);
}

export function createTendedGroundTexture(): THREE.CanvasTexture {
  return paint(TENDED_TILES * PIXELS_PER_TILE, 2, drawTended);
}

export const WILD_TEXTURE_TILES = WILD_TILES;
export const TENDED_TEXTURE_TILES = TENDED_TILES;
