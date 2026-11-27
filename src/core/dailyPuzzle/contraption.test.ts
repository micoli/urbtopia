import { describe, expect, it } from 'vitest';
import { clearParts, isFreeCell, movePart, newEditor, placePart, remainingInventory, removePart, undo, type Editor } from './contraption';
import type { Puzzle } from './types';

const puzzle: Puzzle = {
  board: {
    width: 5,
    height: 6,
    ballStart: { x: 2, y: 0 },
    aims: [
      { kind: 'light', candles: [{ x: 1, y: 2 }] },
      { kind: 'flip', switches: [{ x: 3, y: 2 }] },
      { kind: 'collect', stars: [{ x: 0, y: 3 }], exit: { x: 4, y: 5 } },
    ],
  },
  inventory: ['ramp-right', 'ramp-right', 'spring-left', 'fan-right'],
  witness: [],
};

const placed = (editor: Editor | undefined): Editor => {
  if (!editor) throw new Error('the edit was refused');
  return editor;
};

describe('isFreeCell', () => {
  it('accepts an empty cell of the board', () => {
    expect(isFreeCell(puzzle, [], { x: 2, y: 2 })).toBe(true);
  });

  it.each([
    ['outside the board', { x: 5, y: 2 }],
    ['above the board', { x: 2, y: -1 }],
    ['on the bottom row, where the ball stops', { x: 2, y: 5 }],
    ['on the start of the ball', { x: 2, y: 0 }],
    ['on a candle', { x: 1, y: 2 }],
    ['on a switch', { x: 3, y: 2 }],
    ['on a star', { x: 0, y: 3 }],
  ])('refuses a cell %s', (_, cell) => {
    expect(isFreeCell(puzzle, [], cell)).toBe(false);
  });

  it('refuses a cell that holds a Part', () => {
    expect(isFreeCell(puzzle, [{ kind: 'ramp-right', at: { x: 2, y: 2 } }], { x: 2, y: 2 })).toBe(false);
  });
});

describe('placePart', () => {
  it('puts a Part of the inventory on a free cell', () => {
    const editor = placed(placePart(puzzle, newEditor(), 'spring-left', { x: 2, y: 2 }));

    expect(editor.parts).toEqual([{ kind: 'spring-left', at: { x: 2, y: 2 } }]);
  });

  it('refuses a cell that is not free', () => {
    expect(placePart(puzzle, newEditor(), 'spring-left', { x: 1, y: 2 })).toBeUndefined();
  });

  it('refuses a Part that is not in the inventory', () => {
    expect(placePart(puzzle, newEditor(), 'trampoline-left', { x: 2, y: 2 })).toBeUndefined();
  });

  it('refuses a Part of which every copy is already placed', () => {
    const once = placed(placePart(puzzle, newEditor(), 'spring-left', { x: 2, y: 1 }));

    expect(placePart(puzzle, once, 'spring-left', { x: 2, y: 2 })).toBeUndefined();
  });
});

describe('remainingInventory', () => {
  it('gives back the Parts not placed yet, one entry per copy', () => {
    const editor = placed(placePart(puzzle, newEditor(), 'ramp-right', { x: 2, y: 1 }));

    expect(remainingInventory(puzzle, editor)).toEqual(['ramp-right', 'spring-left', 'fan-right']);
  });
});

describe('movePart', () => {
  it('moves a placed Part to a free cell', () => {
    const editor = placed(placePart(puzzle, newEditor(), 'fan-right', { x: 2, y: 1 }));

    expect(placed(movePart(puzzle, editor, { x: 2, y: 1 }, { x: 4, y: 3 })).parts).toEqual([{ kind: 'fan-right', at: { x: 4, y: 3 } }]);
  });

  it('refuses a move onto a cell that is not free, and leaves the Part where it is', () => {
    const editor = placed(placePart(puzzle, newEditor(), 'fan-right', { x: 2, y: 1 }));

    expect(movePart(puzzle, editor, { x: 2, y: 1 }, { x: 1, y: 2 })).toBeUndefined();
  });

  it('refuses to move from a cell with no Part', () => {
    expect(movePart(puzzle, newEditor(), { x: 2, y: 1 }, { x: 4, y: 3 })).toBeUndefined();
  });
});

describe('removePart', () => {
  it('takes a Part back to the inventory', () => {
    const editor = placed(placePart(puzzle, newEditor(), 'fan-right', { x: 2, y: 1 }));
    const emptied = placed(removePart(editor, { x: 2, y: 1 }));

    expect(emptied.parts).toEqual([]);
    expect(remainingInventory(puzzle, emptied)).toEqual(puzzle.inventory);
  });

  it('refuses to remove from a cell with no Part', () => {
    expect(removePart(newEditor(), { x: 2, y: 1 })).toBeUndefined();
  });
});

describe('undo', () => {
  it('goes back one edit at a time down to the empty board', () => {
    const first = placed(placePart(puzzle, newEditor(), 'fan-right', { x: 2, y: 1 }));
    const second = placed(placePart(puzzle, first, 'spring-left', { x: 3, y: 3 }));

    expect(placed(undo(second)).parts).toEqual(first.parts);
    expect(placed(undo(placed(undo(second)))).parts).toEqual([]);
    expect(undo(newEditor())).toBeUndefined();
  });

  it('undoes a move and a removal', () => {
    const editor = placed(placePart(puzzle, newEditor(), 'fan-right', { x: 2, y: 1 }));
    const moved = placed(movePart(puzzle, editor, { x: 2, y: 1 }, { x: 4, y: 3 }));
    const removed = placed(removePart(moved, { x: 4, y: 3 }));

    expect(placed(undo(removed)).parts).toEqual(moved.parts);
    expect(placed(undo(moved)).parts).toEqual(editor.parts);
  });
});

describe('clearParts', () => {
  it('takes every Part back, and can be undone', () => {
    const editor = placed(placePart(puzzle, placed(placePart(puzzle, newEditor(), 'fan-right', { x: 2, y: 1 })), 'spring-left', { x: 3, y: 3 }));
    const cleared = placed(clearParts(editor));

    expect(cleared.parts).toEqual([]);
    expect(placed(undo(cleared)).parts).toEqual(editor.parts);
    expect(clearParts(newEditor())).toBeUndefined();
  });
});
