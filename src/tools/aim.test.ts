import { describe, expect, it } from 'vitest';
import { aimTile, pointerKindOf } from './aim';

const center = { x: 64, y: 64 };
const hover = { x: 50, y: 70 };

describe('aimTile', () => {
  it('follows the mouse when there is one and it is over the map', () => {
    expect(aimTile('mouse', hover, center)).toBe(hover);
  });

  it('stays on the centre of the screen for touch, whatever the last mouse position', () => {
    expect(aimTile('touch', hover, center)).toBe(center);
  });

  it('falls back to the centre until the mouse has pointed at the map', () => {
    expect(aimTile('mouse', null, center)).toBe(center);
  });
});

describe('aimTile with a pinned tile', () => {
  const pinned = { x: 70, y: 60 };

  it('keeps a touch aim on the pinned tile instead of the screen centre', () => {
    expect(aimTile('touch', null, center, pinned)).toBe(pinned);
  });

  it('still lets the mouse hover win over the pinned tile', () => {
    expect(aimTile('mouse', hover, center, pinned)).toBe(hover);
  });
});

describe('pointerKindOf', () => {
  it('treats only a mouse as a mouse', () => {
    expect(pointerKindOf('mouse')).toBe('mouse');
    expect(pointerKindOf('touch')).toBe('touch');
    expect(pointerKindOf('pen')).toBe('touch');
  });
});
