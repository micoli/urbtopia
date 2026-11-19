import { createBuilding } from '../buildings/buildingSpecs';
import { newGame } from '../engine/newGame';
import type { Command } from '../engine/commands';
import type { GameState } from '../engine/state';
import type { Demonstration, DemonstrationStep, DemonstrationText } from '../demonstrations/scenario';
import { deckOf } from './districtDeck';
import { scoreOfGame } from './districtGame';
import { isPlacementValid } from './districtPlacement';
import { DISTRICT_PLAN } from './districtPlanBalance';
import type { HexCategory } from './districtPlanVocabulary';
import { pairScoreOf, scoreOf, type PlacedHex } from './districtScore';
import { rotateHex, type Hex } from './hex';
import { CENTRE, EDGE_COUNT, cellKey, cellsOfBoard, neighbourOf, oppositeEdge, type Cell } from './hexGrid';

const OFFICE_ID = 1;
const SEED = 'district-demo';
const LESSON_HEXES = 6;

const CATEGORY_NAMES: Record<HexCategory, DemonstrationText> = {
  habitat: ['Habitat', 'Habitat'],
  park: ['Park', 'Parc'],
  commerce: ['Commerce', 'Commerce'],
  industry: ['Industry', 'Industrie'],
  service: ['Service', 'Service'],
  water: ['Water', 'Eau'],
};

const officeOf = (state: GameState) => {
  const office = state.buildings.find(candidate => candidate.id === OFFICE_ID);
  if (!office) throw new Error('demonstration office missing');
  return office;
};

// The score of the game in hand, and how many Hexes are on the board, are what each step must leave.
const checkBoard = (hexes: number, score: number): DemonstrationStep['check'] => state => {
  const game = officeOf(state).district?.game;
  if (!game) throw new Error('no game under way');
  if (game.placements.length !== hexes) throw new Error(`expected ${hexes} Hexes on the board, got ${game.placements.length}`);
  const actual = scoreOfGame({ seed: state.seed, officeId: OFFICE_ID }, game);
  if (actual !== score) throw new Error(`expected a score of ${score}, got ${actual}`);
};

// A pair of touching edges that a placement makes.
interface Pair {
  mine: HexCategory;
  theirs: HexCategory;
  score: number;
}

interface Move {
  cell: Cell;
  rotation: number;
  pairs: Pair[];
  gain: number;
}

const pairsOf = (board: readonly PlacedHex[], cell: Cell, hex: Hex): Pair[] => {
  const byCell = new Map(board.map(item => [cellKey(item.cell), item]));
  return Array.from({ length: EDGE_COUNT }, (_, edge) => edge).flatMap(edge => {
    const neighbour = byCell.get(cellKey(neighbourOf(cell, edge)));
    if (!neighbour) return [];
    const mine = hex.edges[edge]!;
    const theirs = neighbour.hex.edges[oppositeEdge(edge)]!;
    return [{ mine, theirs, score: pairScoreOf(mine, theirs) }];
  });
};

// Each Hex of the lesson goes where it earns the most: the first of the best cells, turned the fewest times.
const bestMove = (board: readonly PlacedHex[], hex: Hex): Move => {
  let best: Move | undefined;
  for (const cell of cellsOfBoard(DISTRICT_PLAN.boardRadius)) {
    if (!isPlacementValid(board, cell)) continue;
    for (let rotation = 0; rotation < EDGE_COUNT; rotation++) {
      const pairs = pairsOf(board, cell, rotateHex(hex, rotation));
      const gain = pairs.reduce((sum, pair) => sum + pair.score, 0);
      if (!best || gain > best.gain) best = { cell, rotation, pairs, gain };
    }
  }
  return best!;
};

const text = (english: string, french: string): DemonstrationText => [english, french];

const turnsText = (rotation: number): DemonstrationText =>
  rotation === 0 ? text('without turning it', 'sans le tourner') : text(`after turning it ${rotation} time${rotation === 1 ? '' : 's'}`, `après l’avoir tourné ${rotation} fois`);

const pairText = ({ mine, theirs, score }: Pair): DemonstrationText => {
  const [mineEnglish, mineFrench] = CATEGORY_NAMES[mine];
  const [theirsEnglish, theirsFrench] = CATEGORY_NAMES[theirs];
  const worth = score === 0 ? text('is worth nothing', 'ne vaut rien') : score > 0 ? text(`is worth +${score}`, `vaut +${score}`) : text(`costs ${-score}`, `coûte ${-score}`);
  return text(`${mineEnglish} beside ${theirsEnglish} ${worth[0]}`, `${mineFrench} à côté ${/^[AEIOUH]/.test(theirsFrench) ? 'd’' : 'de '}${theirsFrench} ${worth[1]}`);
};

const ORDINALS: readonly DemonstrationText[] = [text('first', 'premier'), text('second', 'deuxième'), text('third', 'troisième'), text('fourth', 'quatrième'), text('fifth', 'cinquième'), text('sixth', 'sixième')];

// The lesson plays the first Hexes of the Deck of its own city, each where it earns the most, and says in each step what the touching edges are worth.
const lesson = (): { steps: DemonstrationStep[]; moves: Move[] } => {
  const deck = deckOf(SEED, OFFICE_ID, DISTRICT_PLAN.deckSizes[0]!);
  const board: PlacedHex[] = [{ cell: CENTRE, hex: deck[0]! }];
  const moves: Move[] = [];
  const steps: DemonstrationStep[] = [
    {
      id: 'start',
      title: text('Start a game', 'Lancer une partie'),
      objective: text('Begin a District plan with a Deck of Hexes.', 'Commencer un plan de quartier avec une pioche d’hexagones.'),
      action: text('Press New game. The first Hex, the Start hex, is placed at the centre of the board for you.', 'Appuie sur Nouvelle partie. Le premier hexagone, celui de départ, est posé pour toi au centre du plateau.'),
      explanation: text('Each of the six edges of a Hex has a category: Habitat, Park, Commerce, Industry, Service or Water. The score comes from the edges that touch.', 'Chacun des six bords d’un hexagone a une catégorie : Habitat, Parc, Commerce, Industrie, Service ou Eau. Le score vient des bords qui se touchent.'),
      result: text('The board holds the Start hex and the score is 0.', 'Le plateau contient l’hexagone de départ et le score est de 0.'),
      commands: [{ type: 'StartDistrictGame', buildingId: OFFICE_ID }],
      check: checkBoard(1, 0),
    },
  ];
  let score = 0;
  for (let index = 1; index < LESSON_HEXES; index++) {
    const move = bestMove(board, deck[index]!);
    board.push({ cell: move.cell, hex: rotateHex(deck[index]!, move.rotation) });
    moves.push(move);
    score = scoreOf(board);
    const [ordinalEnglish, ordinalFrench] = ORDINALS[index]!;
    const [turnEnglish, turnFrench] = turnsText(move.rotation);
    const pairs = move.pairs.map(pairText);
    steps.push({
      id: `hex-${index + 1}`,
      title: text(`The ${ordinalEnglish} Hex`, `Le ${ordinalFrench} hexagone`),
      objective: text('Place the Hex where its edges earn the most.', 'Poser l’hexagone là où ses bords rapportent le plus.'),
      action: text(`Place it where the ghost shows, ${turnEnglish}.`, `Pose-le là où le fantôme le montre, ${turnFrench}.`),
      explanation: text(
        `A Hex goes on a free cell that touches a Hex already placed. Here: ${pairs.map(pair => pair[0]).join('; ')}.`,
        `Un hexagone se pose sur une case libre qui touche un hexagone déjà posé. Ici : ${pairs.map(pair => pair[1]).join(' ; ')}.`,
      ),
      result: text(`The Hex earns ${move.gain}: the score is ${score}.`, `L’hexagone rapporte ${move.gain} : le score est de ${score}.`),
      commands: [{ type: 'PlaceDistrictHex', buildingId: OFFICE_ID, cell: move.cell, rotation: move.rotation } satisfies Command],
      check: checkBoard(index + 1, score),
    });
  }
  steps.push({
    id: 'rank',
    title: text('Rank and bonus', 'Rang et bonus'),
    objective: text('See what a whole game earns.', 'Voir ce que rapporte une partie entière.'),
    action: text('A real game has 24 Hexes at Tier 1: play on until the Deck is empty.', 'Une vraie partie compte 24 hexagones au niveau 1 : continue jusqu’à ce que la pioche soit vide.'),
    explanation: text(
      `The best score of the office sets its Rank: Bronze from ${DISTRICT_PLAN.rankScorePerHex.bronze} points per Hex of the Deck, Silver from ${DISTRICT_PLAN.rankScorePerHex.silver}, Gold from ${DISTRICT_PLAN.rankScorePerHex.gold}. Every Deck can be played to Gold. The Rank gives the Homes around the office a Well-being bonus, up to the cap of its Tier.`,
      `Le meilleur score du bureau fixe son rang : Bronze à partir de ${DISTRICT_PLAN.rankScorePerHex.bronze} points par hexagone de la pioche, Argent à partir de ${DISTRICT_PLAN.rankScorePerHex.silver}, Or à partir de ${DISTRICT_PLAN.rankScorePerHex.gold}. Chaque pioche peut être jouée jusqu’à l’Or. Le rang donne aux logements autour du bureau un bonus de bien-être, jusqu’au plafond de son niveau.`,
    ),
    result: text('You can play as often as you like: only your best score counts.', 'Tu peux rejouer autant que tu veux : seul ton meilleur score compte.'),
    check: checkBoard(LESSON_HEXES, score),
  });
  return { steps, moves };
};

export const districtDemonstration: Demonstration = {
  id: 'district-plan-simple',
  buildingType: 'planningOffice',
  buildingId: OFFICE_ID,
  level: 'simple',
  title: text('District plan — The basics', 'Plan de quartier — Les bases'),
  objective: text('Place six Hexes and learn which edges to put side by side.', 'Poser six hexagones et apprendre quels bords placer côte à côte.'),
  initial: () => ({
    ...newGame({ now: 1_700_000_000_000, seed: SEED, tutorial: false, venueTutorials: false }),
    urbs: 10_000,
    buildings: [createBuilding(OFFICE_ID, 'planningOffice', 60, 56, 0)],
    nextId: 100,
  }),
  steps: lesson().steps,
};
