import { beforeEach, describe, expect, it } from 'vitest';
import { remainingInventory } from '../core/dailyPuzzle/contraption';
import type { Cell } from '../core/dailyPuzzle/types';
import { freeCellsFor, puzzleStore } from './puzzleStore';

const state = () => puzzleStore.getState();

function firstFreeCells(count: number): Cell[] {
  const { puzzle, editor } = state();
  return freeCellsFor(puzzle!, editor, { kind: 'any' }).slice(0, count);
}

beforeEach(() => {
  puzzleStore.getState().close();
  puzzleStore.getState().open('store-test', 'easy');
});

describe('puzzleStore', () => {
  it('opens a puzzle on an empty board, ready to edit', () => {
    expect(state().puzzle).not.toBeNull();
    expect(state().editor.parts).toEqual([]);
    expect(state().phase).toBe('edit');
  });

  it('places the Part picked on the free cell tapped', () => {
    const kind = state().puzzle!.inventory[0]!;
    const [cell] = firstFreeCells(1);

    state().pickKind(kind);
    state().tapCell(cell);

    expect(state().editor.parts).toEqual([{ kind, at: cell }]);
  });

  it('keeps holding a Part while copies of it remain, then lets go', () => {
    const { inventory } = state().puzzle!;
    const kind = inventory.find((candidate) => inventory.filter((other) => other === candidate).length >= 2) ?? inventory[0]!;
    const copies = inventory.filter((other) => other === kind).length;
    const cells = firstFreeCells(copies);

    state().pickKind(kind);
    cells.forEach((cell) => state().tapCell(cell));

    expect(remainingInventory(state().puzzle!, state().editor)).not.toContain(kind);
    expect(state().held).toBeNull();
  });

  it('does not place a Part on a cell that is not free', () => {
    const { puzzle } = state();
    state().pickKind(puzzle!.inventory[0]!);

    state().tapCell(puzzle!.board.ballStart);

    expect(state().editor.parts).toEqual([]);
  });

  it('lifts a Part of the board with a tap, then moves it with a tap on a free cell', () => {
    const kind = state().puzzle!.inventory[0]!;
    const [first, second] = firstFreeCells(2);
    state().pickKind(kind);
    state().tapCell(first);

    state().tapCell(first);
    expect(state().held).toEqual({ cell: first });
    state().tapCell(second);

    expect(state().editor.parts).toEqual([{ kind, at: second }]);
    expect(state().held).toBeNull();
  });

  it('takes the Part lifted back to the tray', () => {
    const kind = state().puzzle!.inventory[0]!;
    const [cell] = firstFreeCells(1);
    state().pickKind(kind);
    state().tapCell(cell);
    state().tapCell(cell);

    state().takeBack();

    expect(state().editor.parts).toEqual([]);
  });

  it('undoes an edit and clears the board', () => {
    const { inventory } = state().puzzle!;
    const [first, second] = firstFreeCells(2);
    state().pickKind(inventory[0]!);
    state().tapCell(first);
    state().pickKind(inventory[1]!);
    state().tapCell(second);

    state().undo();
    expect(state().editor.parts).toHaveLength(1);
    state().clear();
    expect(state().editor.parts).toEqual([]);
  });

  it('locks the board while the ball runs and after it, until the player goes back to the start', () => {
    const kind = state().puzzle!.inventory[0]!;
    const [cell] = firstFreeCells(1);
    state().run();

    state().pickKind(kind);
    state().tapCell(cell);
    expect(state().editor.parts).toEqual([]);

    state().finishRun(false);
    state().tapCell(cell);
    expect(state().editor.parts).toEqual([]);

    state().reset();
    state().pickKind(kind);
    state().tapCell(cell);
    expect(state().editor.parts).toHaveLength(1);
  });
});

describe('dragging a Part', () => {
  const dragged = () => state().drag;

  it('only arms a drag on a press, and makes it a drag once the pointer has moved', () => {
    const kind = state().puzzle!.inventory[0]!;

    state().armDrag({ kind });
    expect(dragged()).toMatchObject({ source: { kind }, active: false });
    state().activateDrag();

    expect(dragged()).toMatchObject({ active: true });
  });

  it('drops a Part of the tray on a free cell', () => {
    const kind = state().puzzle!.inventory[0]!;
    const cell = firstFreeCells(1)[0]!;
    state().armDrag({ kind });
    state().activateDrag();

    state().dropDrag({ cell });

    expect(state().editor.parts).toEqual([{ kind, at: cell }]);
    expect(dragged()).toBeNull();
  });

  it('drops a Part of the board on another free cell, and puts it back where it was on a cell that is not free', () => {
    const kind = state().puzzle!.inventory[0]!;
    const [first, second] = firstFreeCells(2) as [Cell, Cell];
    state().pickKind(kind);
    state().tapCell(first);

    state().armDrag({ cell: first });
    state().activateDrag();
    state().dropDrag({ cell: state().puzzle!.board.ballStart });
    expect(state().editor.parts).toEqual([{ kind, at: first }]);

    state().armDrag({ cell: first });
    state().activateDrag();
    state().dropDrag({ cell: second });
    expect(state().editor.parts).toEqual([{ kind, at: second }]);
  });

  it('takes a Part of the board back to the tray when it is dropped there', () => {
    const kind = state().puzzle!.inventory[0]!;
    const cell = firstFreeCells(1)[0]!;
    state().pickKind(kind);
    state().tapCell(cell);

    state().armDrag({ cell });
    state().activateDrag();
    state().dropDrag('tray');

    expect(state().editor.parts).toEqual([]);
  });

  it('changes nothing when a Part is dropped outside the board, or when the drag is cancelled', () => {
    const kind = state().puzzle!.inventory[0]!;
    state().armDrag({ kind });
    state().activateDrag();

    state().dropDrag(null);
    expect(state().editor.parts).toEqual([]);

    state().armDrag({ kind });
    state().cancelDrag();
    expect(dragged()).toBeNull();
  });

  it('keeps the cell under the pointer while dragging', () => {
    const kind = state().puzzle!.inventory[0]!;
    const cell = firstFreeCells(1)[0]!;
    state().armDrag({ kind });
    state().activateDrag();

    state().dragOver(cell);

    expect(dragged()).toMatchObject({ over: cell });
  });

  it('ignores a drag while the ball runs', () => {
    state().run();

    state().armDrag({ kind: state().puzzle!.inventory[0]! });

    expect(dragged()).toBeNull();
  });
});

describe('solving for the dev tools', () => {
  it('puts the witness of the puzzle on the board, in one edit that can be undone', () => {
    const { puzzle } = state();

    state().solveForDev();

    expect(state().editor.parts).toEqual(puzzle!.witness);
    expect(remainingInventory(puzzle!, state().editor)).toHaveLength(puzzle!.inventory.length - puzzle!.witness.length);
    state().undo();
    expect(state().editor.parts).toEqual([]);
  });

  it('replaces the Parts already placed', () => {
    const kind = state().puzzle!.inventory[0]!;
    state().pickKind(kind);
    state().tapCell(firstFreeCells(1)[0]);

    state().solveForDev();

    expect(state().editor.parts).toEqual(state().puzzle!.witness);
  });

  it('does nothing while the ball runs', () => {
    state().run();

    state().solveForDev();

    expect(state().editor.parts).toEqual([]);
  });
});

describe('stopping a run', () => {
  it('goes back to editing at once, with the Parts where they were', () => {
    const kind = state().puzzle!.inventory[0]!;
    const cell = firstFreeCells(1)[0]!;
    state().pickKind(kind);
    state().tapCell(cell);
    state().run();

    state().reset();

    expect(state().phase).toBe('edit');
    expect(state().editor.parts).toEqual([{ kind, at: cell }]);
  });
});
