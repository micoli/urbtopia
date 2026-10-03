import { describe, expect, it } from 'vitest';
import { confirmKeyAction } from './confirmKeys';

const press = (key: string, overrides: Partial<{ repeat: boolean; typing: boolean; canConfirm: boolean }> = {}) =>
  confirmKeyAction({ key, repeat: false, typing: false }, overrides.canConfirm ?? true);

describe('confirmKeyAction', () => {
  it('confirms with Enter', () => {
    expect(press('Enter')).toBe('confirm');
  });

  it('cancels with Escape', () => {
    expect(press('Escape')).toBe('cancel');
  });

  it('does not confirm with Enter when confirming is not allowed, but still cancels with Escape', () => {
    expect(press('Enter', { canConfirm: false })).toBeNull();
    expect(press('Escape', { canConfirm: false })).toBe('cancel');
  });

  it('ignores a key that is held down', () => {
    expect(confirmKeyAction({ key: 'Enter', repeat: true, typing: false }, true)).toBeNull();
    expect(confirmKeyAction({ key: 'Escape', repeat: true, typing: false }, true)).toBeNull();
  });

  it('leaves the keys to a text field being typed in', () => {
    expect(confirmKeyAction({ key: 'Enter', repeat: false, typing: true }, true)).toBeNull();
    expect(confirmKeyAction({ key: 'Escape', repeat: false, typing: true }, true)).toBeNull();
  });

  it('ignores every other key', () => {
    expect(press('a')).toBeNull();
    expect(press(' ')).toBeNull();
  });
});
