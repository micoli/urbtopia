import { describe, expect, it } from 'vitest';
import { EMPTY_DISTRICT_OFFICE, boardOf, giveUp, handOf, isGameOver, placeHex, scoreOfGame, startGame, type DistrictContext, type DistrictOffice, type DistrictOutcome } from './districtGame';
import { deckOf } from './districtDeck';
import { isPlacementValid } from './districtPlacement';
import { CENTRE, cellsOfBoard } from './hexGrid';
import { rotateHex } from './hex';

const context: DistrictContext = { seed: 'seed', officeId: 1 };

const officeOf = (outcome: DistrictOutcome): DistrictOffice => {
  if ('refusal' in outcome) throw new Error(`refused: ${outcome.refusal}`);
  return outcome.office;
};

const started = (tier = 1, office: DistrictOffice = EMPTY_DISTRICT_OFFICE): DistrictOffice => officeOf(startGame(context, office, tier));

// Places each Hex on the first valid cell, unturned.
const playOut = (office: DistrictOffice): DistrictOffice => {
  let current = office;
  while (current.game && !isGameOver(current.game)) {
    const board = boardOf(context, current.game);
    const cell = cellsOfBoard(4).find(candidate => isPlacementValid(board, candidate))!;
    current = officeOf(placeHex(context, current, cell, 0));
  }
  return current;
};

describe('starting a game', () => {
  it('places the Start hex at the centre and numbers the game', () => {
    const office = started();
    expect(office.gameNumber).toBe(1);
    expect(office.game).toEqual({ number: 1, deckSize: 24, placements: [{ cell: CENTRE, rotation: 0 }] });
  });

  it('uses the Deck of the Tier', () => {
    expect(started(3).game?.deckSize).toBe(32);
  });

  it('puts the first Hex of the Deck at the centre', () => {
    const office = started();
    expect(boardOf(context, office.game!)[0]!.hex).toEqual(deckOf('seed', 1, 24)[0]);
  });

  it('plays the same Deck in every game of the office', () => {
    const first = started();
    const second = started(1, officeOf(giveUp(first)));
    expect(second.gameNumber).toBe(2);
    expect(handOf(context, second.game!)).toEqual(handOf(context, first.game!));
    expect(boardOf(context, second.game!)).toEqual(boardOf(context, first.game!));
  });

  it('refuses while a game is under way', () => {
    expect(startGame(context, started(), 1)).toEqual({ refusal: 'gameUnderWay' });
  });
});

describe('placing a Hex', () => {
  it('adds the placement with its rotation, and the Hex turned on the board', () => {
    const office = officeOf(placeHex(context, started(), { q: 1, r: 0 }, 2));
    expect(office.game?.placements).toHaveLength(2);
    const deck = deckOf('seed', 1, 24);
    expect(boardOf(context, office.game!)[1]).toEqual({ cell: { q: 1, r: 0 }, hex: rotateHex(deck[1]!, 2) });
  });

  it.each([
    { name: 'a cell that touches nothing', cell: { q: 3, r: 0 } },
    { name: 'the cell of the Start hex', cell: CENTRE },
    { name: 'a cell beyond the board', cell: { q: 9, r: 0 } },
  ])('refuses $name', ({ cell }) => {
    expect(placeHex(context, started(), cell, 0)).toEqual({ refusal: 'invalidPlacement' });
  });

  it.each([-1, 6, 1.5, Number.NaN])('refuses the rotation %s', rotation => {
    expect(placeHex(context, started(), { q: 1, r: 0 }, rotation)).toEqual({ refusal: 'invalidRotation' });
  });

  it('refuses without a game', () => {
    expect(placeHex(context, EMPTY_DISTRICT_OFFICE, { q: 1, r: 0 }, 0)).toEqual({ refusal: 'noGameUnderWay' });
  });

  it('shows the Hex to place and the next two', () => {
    const office = started();
    const deck = deckOf('seed', 1, 24);
    expect(handOf(context, office.game!)).toEqual({ current: deck[1], upcoming: [deck[2], deck[3]] });
  });

  it('shows no Hex to place once the Deck is empty', () => {
    const over = playOut(started());
    expect(handOf(context, over.game!)).toEqual({ current: undefined, upcoming: [] });
  });
});

describe('the end of a game', () => {
  it('comes when the Deck is empty, and keeps the score as the best', () => {
    const over = playOut(started());
    expect(over.game?.placements).toHaveLength(24);
    expect(isGameOver(over.game!)).toBe(true);
    expect(over.best).toEqual({ score: scoreOfGame(context, over.game!), game: over.game });
  });

  it('refuses a placement once the Deck is empty', () => {
    expect(placeHex(context, playOut(started()), { q: 0, r: 4 }, 0)).toEqual({ refusal: 'noGameUnderWay' });
  });

  it('is replaced in the office by the next game, with the next number', () => {
    const next = started(1, playOut(started()));
    expect(next.gameNumber).toBe(2);
    expect(next.game?.placements).toHaveLength(1);
  });

  it('keeps the better of two games as the best, and a game that ties does not replace it', () => {
    const first = playOut(started());
    const second = playOut(started(1, first));
    const best = Math.max(first.best!.score, scoreOfGame(context, second.game!));
    expect(second.best!.score).toBe(best);
    if (scoreOfGame(context, second.game!) <= first.best!.score) expect(second.best).toBe(first.best);
    else expect(second.best!.game.number).toBe(2);
  });
});

describe('giving up', () => {
  it('drops the game in hand and keeps the best one', () => {
    const played = playOut(started());
    const second = started(1, played);
    const gaveUp = officeOf(giveUp(second));
    expect(gaveUp.game).toBeUndefined();
    expect(gaveUp.best).toBe(played.best);
    expect(gaveUp.gameNumber).toBe(2);
  });

  it('lets the next game have the next number', () => {
    const gaveUp = officeOf(giveUp(started()));
    expect(started(1, gaveUp).gameNumber).toBe(2);
  });

  it('refuses without a game under way', () => {
    expect(giveUp(EMPTY_DISTRICT_OFFICE)).toEqual({ refusal: 'noGameUnderWay' });
    expect(giveUp(playOut(started()))).toEqual({ refusal: 'noGameUnderWay' });
  });
});

describe('a Tier raised during a game', () => {
  it('leaves the game under way with the Deck it started with', () => {
    const office = started(1);
    expect(placeHex(context, office, { q: 1, r: 0 }, 0)).toHaveProperty('office.game.deckSize', 24);
  });
});
