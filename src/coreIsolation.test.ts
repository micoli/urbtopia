import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

async function lintAsCore(code: string) {
  const [result] = await eslint.lintText(code, { filePath: 'src/core/probe.ts' });
  return result?.messages.filter((m) => m.severity === 2) ?? [];
}

describe('core isolation lint rules', () => {
  it.each([
    ["import * as THREE from 'three';"],
    ["import { useState } from 'react';"],
    ["import { create } from 'zustand';"],
    ['export const a = Math.random();'],
    ['export const a = Date.now();'],
    ['export const a = new Date();'],
    ['export const a = Date.parse("2020-01-01");'],
    ['export const a = performance.now();'],
    ['export const a = document.title;'],
    ['export const a = localStorage.getItem("k");'],
    ['export const a = fetch("/x");'],
    ['export const a = indexedDB;'],
  ])('rejects %s inside the core', async (code) => {
    expect((await lintAsCore(code)).length).toBeGreaterThan(0);
  });

  it('accepts pure code with an explicit timestamp', async () => {
    expect(await lintAsCore('export const a = new Date(1000).getTime();')).toEqual([]);
  });
});
