import { describe, expect, it } from 'vitest';
import { demonstrationsOf, demonstrationTypeOf } from './catalog';

describe('the demonstrations of a type', () => {
  it.each(['vault', 'materialDepot'] as const)('are those of the Storehouse for a %s, which runs its interior', type => {
    expect(demonstrationTypeOf(type)).toBe('storehouse');
    expect(demonstrationsOf(type).length).toBeGreaterThan(0);
    expect(demonstrationsOf(type)).toEqual(demonstrationsOf('storehouse'));
  });

  it('are those of the type itself otherwise', () => {
    expect(demonstrationTypeOf('mill')).toBe('mill');
    expect(demonstrationsOf('farm')).toEqual([]);
  });
});
