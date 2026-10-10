import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import models from '../assets/models.json';

const entries = Object.entries(models).filter(([id]) => id !== '$schema') as [string, { file: string }][];
const ids = new Set(entries.map(([id]) => id));
const files = new Set(entries.map(([, { file }]) => file));
const packs = new Set(entries.map(([, { file }]) => file.split('/')[0]!));

const sourcesIn = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourcesIn(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && !entry.name.includes('.generated.') ? [path] : [];
  });

const literalsOf = (source: string): string[] => [...source.matchAll(/(['"`])((?:(?!\1)[^\\\n])*)\1/g)].map(match => match[2]!);

const isModelLiteral = (literal: string): boolean => ids.has(literal) || files.has(literal) || (packs.has(literal.split('/')[0]!) && literal.includes('/') && !literal.includes('/Textures/'));

describe('model literals', () => {
  it('leave every model to the definitions: the scene reaches them through Model ids it reads', () => {
    const offenders = sourcesIn('src').flatMap(file => literalsOf(readFileSync(file, 'utf8')).filter(isModelLiteral).map(literal => `${file}: ${literal}`));
    expect(offenders).toEqual([]);
  });
});
