import { createBuilding } from '../buildings/buildingSpecs';
import { newGame } from '../engine/newGame';
import type { Command } from '../engine/commands';
import type { GameState } from '../engine/state';
import type { Demonstration, DemonstrationStep, DemonstrationText } from '../demonstrations/scenario';
import { DISTRICT_PLAN } from './districtPlanBalance';
import { scoreOfGame } from './districtGame';
import type { Cell } from './hexGrid';

const OFFICE_ID = 1;
const SEED = 'district-demo-2';

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

const place = (cell: Cell, rotation: number): Command => ({ type: 'PlaceDistrictHex', buildingId: OFFICE_ID, cell, rotation });

const text = (english: string, french: string): DemonstrationText => [english, french];

const steps: readonly DemonstrationStep[] = [
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
  {
    id: 'match',
    title: text('Match two edges', 'Assortir deux bords'),
    objective: text('Place the next Hex so that its edge meets an edge of the Start hex.', 'Poser l’hexagone suivant pour que son bord rencontre un bord de celui de départ.'),
    action: text('Pick the cell to the west of the Start hex and turn the Hex twice, so that its Commerce edge faces the Habitat edge.', 'Choisis la case à l’ouest de l’hexagone de départ et fais tourner l’hexagone deux fois, pour que son bord Commerce fasse face au bord Habitat.'),
    explanation: text('A Hex goes on a free cell that touches a Hex already placed. Habitat beside Commerce is worth +1.', 'Un hexagone se pose sur une case libre qui touche un hexagone déjà posé. Habitat à côté de Commerce vaut +1.'),
    result: text('The score is 1.', 'Le score est de 1.'),
    commands: [place({ q: -1, r: 0 }, 2)],
    check: checkBoard(2, 1),
  },
  {
    id: 'park',
    title: text('Put a Park beside the Habitat', 'Mettre un Parc à côté de l’Habitat'),
    objective: text('Earn more with a good neighbour.', 'Gagner davantage avec un bon voisin.'),
    action: text('Pick the cell south-west of the Start hex and turn the Hex twice: its Park edge faces the Habitat edge.', 'Choisis la case au sud-ouest de l’hexagone de départ et fais tourner l’hexagone deux fois : son bord Parc fait face au bord Habitat.'),
    explanation: text('Habitat beside Park is worth +3, the best pair. The Water edge beside Commerce is worth nothing: some pairs simply do not count.', 'Habitat à côté de Parc vaut +3, la meilleure paire. Le bord Eau à côté de Commerce ne vaut rien : certaines paires ne comptent pas.'),
    result: text('The score is 4.', 'Le score est de 4.'),
    commands: [place({ q: -1, r: 1 }, 2)],
    check: checkBoard(3, 4),
  },
  {
    id: 'water',
    title: text('Touch two Hexes at once', 'Toucher deux hexagones à la fois'),
    objective: text('Score on more than one edge with a single Hex.', 'Marquer sur plusieurs bords avec un seul hexagone.'),
    action: text('Place the next Hex between them, to the west of the Park Hex, turned three times.', 'Pose l’hexagone suivant entre eux, à l’ouest de celui du Parc, tourné trois fois.'),
    explanation: text('Park beside Water is worth +2 and Service beside Commerce +1: every edge that touches counts, so a cell with two neighbours pays twice.', 'Parc à côté d’Eau vaut +2 et Service à côté de Commerce +1 : chaque bord qui touche compte, une case à deux voisins paie donc deux fois.'),
    result: text('The score is 7.', 'Le score est de 7.'),
    commands: [place({ q: -2, r: 1 }, 3)],
    check: checkBoard(4, 7),
  },
  {
    id: 'industry',
    title: text('Keep Industry away from Habitat', 'Éloigner l’Industrie de l’Habitat'),
    objective: text('Avoid a pair that costs points.', 'Éviter une paire qui fait perdre des points.'),
    action: text('Place the next Hex north of the Start hex and turn it once: its Park edge faces the Habitat, and its other Park edge faces the Industry of the Hex to the west.', 'Pose l’hexagone suivant au nord de celui de départ et fais-le tourner une fois : son bord Parc fait face à l’Habitat, et son autre bord Parc fait face à l’Industrie de l’hexagone voisin.'),
    explanation: text('Habitat beside Industry is worth −2. A Park between them keeps the peace: Park beside Habitat is +3, and Park beside Industry is 0.', 'Habitat à côté d’Industrie vaut −2. Un Parc entre les deux garde la paix : Parc à côté d’Habitat vaut +3, et Parc à côté d’Industrie 0.'),
    result: text('The score is 10.', 'Le score est de 10.'),
    commands: [place({ q: 0, r: -1 }, 1)],
    check: checkBoard(5, 10),
  },
  {
    id: 'pair',
    title: text('Make two good pairs with one Hex', 'Faire deux bonnes paires avec un hexagone'),
    objective: text('Finish this first plan with the best move.', 'Terminer ce premier plan par le meilleur coup.'),
    action: text('Place the last Hex of the lesson below the Water Hex, without turning it: both its Habitat edges meet a Park.', 'Pose le dernier hexagone de la leçon sous celui de l’Eau, sans le tourner : ses deux bords Habitat rencontrent un Parc.'),
    explanation: text('Two Habitat–Park pairs at once are worth +6. Turning a Hex before placing it is how you find such a cell.', 'Deux paires Habitat–Parc d’un coup valent +6. Tourner un hexagone avant de le poser est la façon de trouver une telle case.'),
    result: text('The score is 16.', 'Le score est de 16.'),
    commands: [place({ q: -2, r: 2 }, 0)],
    check: checkBoard(6, 16),
  },
  {
    id: 'rank',
    title: text('Rank and bonus', 'Rang et bonus'),
    objective: text('See what a whole game earns.', 'Voir ce que rapporte une partie entière.'),
    action: text('A real game has 24 Hexes at Tier 1: play on until the Deck is empty.', 'Une vraie partie compte 24 hexagones au niveau 1 : continue jusqu’à ce que la pioche soit vide.'),
    explanation: text(`The best score of the office sets its Rank: Bronze from ${DISTRICT_PLAN.rankScorePerHex.bronze} points per Hex of the Deck, Silver from ${DISTRICT_PLAN.rankScorePerHex.silver}, Gold from ${DISTRICT_PLAN.rankScorePerHex.gold}. The Rank gives the Homes around the office a Well-being bonus, up to the cap of its Tier.`, `Le meilleur score du bureau fixe son rang : Bronze à partir de ${DISTRICT_PLAN.rankScorePerHex.bronze} points par hexagone de la pioche, Argent à partir de ${DISTRICT_PLAN.rankScorePerHex.silver}, Or à partir de ${DISTRICT_PLAN.rankScorePerHex.gold}. Le rang donne aux logements autour du bureau un bonus de bien-être, jusqu’au plafond de son niveau.`),
    result: text('You can play as often as you like: only your best score counts.', 'Tu peux rejouer autant que tu veux : seul ton meilleur score compte.'),
    check: checkBoard(6, 16),
  },
];

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
  steps,
};
