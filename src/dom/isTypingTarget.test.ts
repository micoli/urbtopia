import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isTypingTarget } from './isTypingTarget';

class FakeElement {
  constructor(
    readonly tagName: string,
    readonly isContentEditable = false,
    private roles: string[] = [],
  ) {}

  closest(selector: string): FakeElement | null {
    return this.roles.some((role) => selector.includes(`[role="${role}"]`)) ? this : null;
  }
}

describe('isTypingTarget', () => {
  beforeEach(() => vi.stubGlobal('HTMLElement', FakeElement));
  afterEach(() => vi.unstubAllGlobals());

  it('is true for text fields, selects and editable content', () => {
    for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) expect(isTypingTarget(new FakeElement(tag) as never)).toBe(true);
    expect(isTypingTarget(new FakeElement('DIV', true) as never)).toBe(true);
  });

  it('is true inside a dropdown, which owns the arrow keys', () => {
    expect(isTypingTarget(new FakeElement('BUTTON', false, ['combobox']) as never)).toBe(true);
    expect(isTypingTarget(new FakeElement('LI', false, ['listbox']) as never)).toBe(true);
  });

  it('is false for the game and for plain buttons', () => {
    expect(isTypingTarget(new FakeElement('CANVAS') as never)).toBe(false);
    expect(isTypingTarget(new FakeElement('BUTTON') as never)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
