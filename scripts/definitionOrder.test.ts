import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { collectionDir, idOfFile, jsonFilesIn, orderFileOf, readOrder } from './collectionRead.ts';
import { COLLECTION_NAMES } from './collections.ts';
import { describeProblem, orderProblems } from './definitionProblems.ts';
import { orderJson } from './collectionFiles.ts';
import { listedFixtureIds } from './fixtureOrder.ts';
import { readCollection } from './collectionRead.ts';

describe('order files of the definitions', () => {
  it.each(COLLECTION_NAMES)('%s: lists every definition once and nothing else', name => {
    const dir = collectionDir(name);
    const ids = name === 'fixtures' ? listedFixtureIds(readCollection('fixtures'), readCollection('fixtureTemplates')) : jsonFilesIn(dir).map(idOfFile);
    const problems = orderProblems(readOrder(dir), ids).map(describeProblem);
    expect(problems).toEqual([]);
  });

  it.each(COLLECTION_NAMES)('%s: is written one id per line, so that a change is a one-line diff', name => {
    const file = orderFileOf(collectionDir(name));
    expect(readFileSync(file, 'utf8')).toBe(orderJson(readOrder(collectionDir(name))));
  });
});

describe('orderProblems', () => {
  it('accepts an order that matches the definitions, whatever its sequence', () => {
    expect(orderProblems(['b', 'a'], ['a', 'b'])).toEqual([]);
  });

  it('reports a definition missing from the order file', () => {
    expect(orderProblems(['a'], ['a', 'b'])).toEqual([{ id: 'b', path: '', message: 'missing from the order file' }]);
  });

  it('reports an id of the order file with no definition', () => {
    expect(orderProblems(['a', 'ghost'], ['a'])).toEqual([{ id: 'ghost', path: '', message: 'listed in the order file but has no definition' }]);
  });

  it('reports an id listed twice', () => {
    expect(orderProblems(['a', 'a'], ['a'])).toEqual([{ id: 'a', path: '', message: 'listed twice in the order file' }]);
  });
});
