import { interiorLinksOf } from '../factory/interiorLinks';
import { assignedFixturesOf, type GoodId } from '../index';
import type { Command } from '../engine/commands';
import type { FixtureId, Rotation } from '../engine/state';
import { BUILDING_ID, lineCity, roomOf } from './lineInterior';
import type { Demonstration, DemonstrationStep, DemonstrationText } from './scenario';

type Piece = readonly [fixture: FixtureId, x: number, y: number, rotation: Rotation];

const t = (en: string, fr: string): DemonstrationText => [en, fr];

// Four Mixers along the back wall, each with its Conveyor going down to an Oven; the middle Mixers share a split Conveyor that feeds two Ovens.
const MIXERS: readonly Piece[] = [
  ['bakeryMixer', 0, 0, 0], ['bakeryMixerLeft', 4, 0, 0], ['bakeryMixer', 6, 0, 0], ['bakeryMixerLeft', 9, 0, 0],
];

const DRIVE: readonly Piece[] = [
  ['bakeryMotor', 1, 1, 3], ['bakeryShaft', 1, 0, 1], ['bakeryBevelTee', 2, 0, 0], ['bakeryBevelTee', 2, 1, 1], ['bakeryShaft', 2, 2, 2], ['bakeryBevel', 2, 3, 2], ['bakeryShaft', 3, 0, 1],
  ['bakeryMotor', 7, 1, 3], ['bakeryShaft', 7, 0, 1], ['bakeryBevelTee', 8, 0, 0], ['bakeryBevelTee', 8, 1, 1], ['bakeryShaft', 8, 2, 0], ['bakeryBevel', 8, 3, 2],
];

const LINES: readonly Piece[] = [
  ['bakeryConveyor', 0, 1, 0], ['bakeryConveyor', 0, 2, 0], ['bakeryConveyor', 0, 3, 0], ['bakeryConveyor', 0, 5, 0],
  ['bakeryConveyorElbowLeft', 3, 1, 1], ['bakeryConveyorElbowRight', 4, 1, 0], ['bakeryConveyor', 3, 2, 0], ['bakeryConveyor', 3, 3, 0],
  ['bakeryConveyorSplit', 3, 5, 0], ['bakeryConveyorElbowRight', 4, 5, 3], ['bakeryConveyorElbowLeft', 2, 5, 1],
  ['bakeryConveyor', 6, 1, 0], ['bakeryConveyor', 6, 2, 0], ['bakeryConveyor', 6, 3, 0], ['bakeryConveyor', 6, 5, 0],
  ['bakeryConveyor', 9, 1, 0], ['bakeryConveyor', 9, 2, 0], ['bakeryConveyor', 9, 3, 0], ['bakeryConveyor', 9, 5, 0],
];

// Two Pumps and Tanks feed the four Ovens with gas through Pipes.
const OVENS: readonly Piece[] = [
  ['bakeryOvenRight', 0, 4, 0], ['bakeryOven', 3, 4, 0], ['bakeryOvenRight', 6, 4, 0], ['bakeryOven', 9, 4, 0],
  ['bakeryTank', 1, 2, 0], ['bakeryPump', 1, 3, 0], ['bakeryPipeTee', 1, 4, 2], ['bakeryPipe', 2, 4, 1],
  ['bakeryTank', 7, 2, 0], ['bakeryPump', 7, 3, 0], ['bakeryPipeTee', 7, 4, 2], ['bakeryPipe', 8, 4, 1],
];

// The front row: five Counters, separated by Walls.
const FRONT: readonly Piece[] = [
  ['bakeryCounter', 0, 6, 2], ['bakeryWall', 1, 6, 0], ['bakeryCounter', 2, 6, 2], ['bakeryWall', 3, 6, 0], ['bakeryCounter', 4, 6, 2],
  ['bakeryWall', 5, 6, 0], ['bakeryCounter', 6, 6, 2], ['bakeryWall', 7, 6, 0], ['bakeryWall', 8, 6, 0], ['bakeryCounter', 9, 6, 2],
];

const PIECES: readonly Piece[] = [...MIXERS, ...DRIVE, ...LINES, ...OVENS, ...FRONT];
const idOf = (piece: Piece): number => PIECES.indexOf(piece) + 1;
const ofType = (pieces: readonly Piece[], type: string) => pieces.filter(piece => piece[0] === type || piece[0] === `${type}Right`);
const BAKING_OVENS = ofType(OVENS, 'bakeryOven');
const COUNTERS = FRONT.filter(piece => piece[0] === 'bakeryCounter');
const RECIPES: readonly string[] = ['cherryClafoutis', 'bread', 'appleCake', 'appleCake'];
const SOLD: readonly string[] = ['cherryClafoutis', 'bread', 'bread', 'appleCake', 'appleCake'];
const BAKERS = 4;
const SELLERS = 5;
const SLOTS = 5;

const place = (pieces: readonly Piece[]): Command[] => pieces.map(([fixture, x, y, rotation]) => ({ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture, x, y, rotation }));
const cells = (pieces: readonly Piece[]) => pieces.map(([, x, y]) => ({ x, y }));

interface Expectation {
  placed: number;
  picked?: boolean;
  assigned?: boolean;
}

const check = ({ placed, picked = false, assigned = false }: Expectation): DemonstrationStep['check'] => state => {
  const bakery = roomOf(state);
  const fixtures = bakery.interior?.fixtures ?? [];
  if (fixtures.length !== placed) throw new Error(`expected ${placed} fixtures, got ${fixtures.length}`);
  const ovens = fixtures.filter(fixture => fixture.type === 'bakeryOven' || fixture.type === 'bakeryOvenRight');
  const counters = fixtures.filter(fixture => fixture.type === 'bakeryCounter');
  const recipes = ovens.map(oven => oven.recipe as string | undefined).join(',');
  const sold = counters.map(counter => counter.soldGood as string | undefined).join(',');
  if ((recipes === RECIPES.join(',') && sold === SOLD.join(',')) !== picked) throw new Error(`expected the recipes picked: ${picked}`);
  if ((assignedFixturesOf(bakery.interior, 'baker').length === BAKERS) !== assigned) throw new Error(`expected the bakers assigned: ${assigned}`);
  if (assigned && interiorLinksOf(fixtures).linked.size === 0) throw new Error('expected linked Machines');
};

const step = (id: string, title: DemonstrationText, objective: DemonstrationText, action: DemonstrationText, explanation: DemonstrationText, result: DemonstrationText, commands: readonly Command[], highlight: readonly Piece[], expectation: Expectation): DemonstrationStep =>
  ({ id, title, objective, action, explanation, result, commands, highlight: cells(highlight), check: check(expectation) });

const steps: DemonstrationStep[] = [
  {
    id: 'goal', title: t('A whole bakery', 'Une boulangerie complète'), objective: t('Fit out a Tier 5 Bakery interior with four Mixers, four Ovens and five counters.', 'Équiper un intérieur de boulangerie de niveau 5 avec quatre pétrins, quatre fours et cinq comptoirs.'),
    action: t('The room you see is an empty Tier 5 Bakery interior. You will build the whole layout in a few steps.', 'La salle que tu vois est un intérieur de boulangerie de niveau 5, vide. Tu vas construire toute la disposition en quelques étapes.'),
    explanation: t('Two Motors drive the Mixers through Bevel tees, two Pumps feed the Ovens with gas, and a split Conveyor shares the dough of two Mixers between two Ovens.', 'Deux moteurs entraînent les pétrins par des renvois en té, deux pompes alimentent les fours en gaz, et un tapis diviseur partage la pâte de deux pétrins entre deux fours.'),
    result: t('The room is empty.', 'La salle est vide.'), check: check({ placed: 0 }),
  },
  step('mixers', t('Four Mixers and their drive', 'Quatre pétrins et leur force'), t('Knead the dough.', 'Pétrir la pâte.'), t('Place the four Mixers along the back wall, with a Motor, Shafts and Bevel gears on each side.', 'Place les quatre pétrins le long du mur du fond, avec un moteur, des arbres et des renvois coniques de chaque côté.'),
    t('Each Motor drives two Mixers: the Bevel tees take its Drive in a side and give it to the Shafts that reach them.', 'Chaque moteur entraîne deux pétrins : les renvois en té prennent sa force par un côté et la donnent aux arbres qui les atteignent.'),
    t('The Mixers turn, their dough has nowhere to go.', 'Les pétrins tournent, leur pâte n’a nulle part où aller.'), place([...MIXERS, ...DRIVE]), [...MIXERS, ...DRIVE], { placed: MIXERS.length + DRIVE.length }),
  step('lines', t('Carry the dough', 'Porter la pâte'), t('Lead each dough to its Oven.', 'Mener chaque pâte à son four.'), t('Place the Conveyors under the Mixers, with the elbows, the split Conveyor and the Conveyors below the Ovens.', 'Place les tapis sous les pétrins, avec les coudes, le tapis diviseur et les tapis sous les fours.'),
    t('The elbows bring two Mixers into one Conveyor, and the split Conveyor sends the baked goods to two counters.', 'Les coudes réunissent deux pétrins sur un tapis, et le tapis diviseur envoie la production vers deux comptoirs.'),
    t('The Lines wait for their Ovens.', 'Les chaînes attendent leurs fours.'), place(LINES), LINES, { placed: MIXERS.length + DRIVE.length + LINES.length }),
  step('ovens', t('Four Ovens and their gas', 'Quatre fours et leur gaz'), t('Bake the dough.', 'Cuire la pâte.'), t('Place the four Ovens, then a Tank, a Pump and Pipes on each side.', 'Place les quatre fours, puis un réservoir, une pompe et des tuyaux de chaque côté.'),
    t('A Pipe tee gives the gas of one Pump to two Ovens, as a Bevel tee does with a Drive.', 'Un tuyau en té donne le gaz d’une pompe à deux fours, comme un renvoi en té le fait d’une force.'),
    t('The Ovens run.', 'Les fours fonctionnent.'), place(OVENS), OVENS, { placed: MIXERS.length + DRIVE.length + LINES.length + OVENS.length }),
  step('front', t('Counters and walls', 'Comptoirs et murs'), t('Close the front and sell.', 'Fermer la façade et vendre.'), t('Place the five counters along the front, with the Walls between them.', 'Place les cinq comptoirs le long de la façade, avec les murs entre eux.'),
    t('Walls keep the front closed where no counter stands.', 'Les murs gardent la façade fermée là où il n’y a pas de comptoir.'),
    t('Every Line ends at a counter.', 'Chaque chaîne se termine à un comptoir.'), place(FRONT), FRONT, { placed: PIECES.length }),
  step('recipes', t('Pick the recipes', 'Choisir les recettes'), t('Say what each Oven bakes and each counter sells.', 'Dire ce que cuit chaque four et ce que vend chaque comptoir.'), t('Pick cherry clafoutis, bread and apple cake on the Ovens, and the matching goods on the counters.', 'Choisis le clafoutis aux cerises, le pain et le gâteau aux pommes sur les fours, et les produits correspondants sur les comptoirs.'),
    t('A counter sells what the Oven in its Line bakes: the goods must match.', 'Un comptoir vend ce que cuit le four de sa chaîne : les produits doivent correspondre.'),
    t('The Ovens and the counters are set.', 'Les fours et les comptoirs sont réglés.'),
    [...BAKING_OVENS.map((piece, index): Command => ({ type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId: idOf(piece), good: RECIPES[index] as GoodId })), ...COUNTERS.map((piece, index): Command => ({ type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId: idOf(piece), good: SOLD[index] as GoodId }))],
    [...BAKING_OVENS, ...COUNTERS], { placed: PIECES.length, picked: true }),
  step('hire', t('Hire the staff', 'Embaucher le personnel'), t('Provide the workers.', 'Recruter les employés.'), t('Hire four bakers, five sellers and two technicians.', 'Embauche quatre boulangers, cinq vendeurs et deux techniciens.'),
    t('A baker works at an Oven, a seller at a counter, and the technicians repair the worn pieces.', 'Un boulanger travaille à un four, un vendeur à un comptoir, et les techniciens réparent les pièces usées.'),
    t('The workers are available.', 'Les employés sont disponibles.'),
    [...Array.from({ length: BAKERS }, (): Command => ({ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'baker' })), ...Array.from({ length: SELLERS }, (): Command => ({ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'seller' })), { type: 'HireInteriorTechnician', buildingId: BUILDING_ID }, { type: 'HireInteriorTechnician', buildingId: BUILDING_ID }],
    [], { placed: PIECES.length, picked: true }),
  step('assign', t('Assign the bakers', 'Affecter les boulangers'), t('Start the baking.', 'Démarrer la cuisson.'), t('Assign a baker to each Oven.', 'Affecte un boulanger à chaque four.'),
    t('An Oven only bakes once its baker stands at it.', 'Un four ne cuit que lorsque son boulanger s’y tient.'),
    t('The bakery bakes by itself.', 'La boulangerie cuit seule.'),
    BAKING_OVENS.map((piece): Command => ({ type: 'AssignInteriorStaff', buildingId: BUILDING_ID, fixtureId: idOf(piece) })), BAKING_OVENS, { placed: PIECES.length, picked: true, assigned: true }),
];

export const bakeryExpert: Demonstration = {
  id: 'bakery-expert', buildingType: 'bakery', buildingId: BUILDING_ID, level: 'expert', title: t('Bakery — Expert', 'Boulangerie — Expert'), objective: t('Build a whole bakery: four Mixers, four Ovens and five counters.', 'Construire une boulangerie complète : quatre pétrins, quatre fours et cinq comptoirs.'),
  initial: () => {
    const state = lineCity('bakery', 'guided-bakery-expert-v1', 5);
    const bakery = state.buildings.find(building => building.id === BUILDING_ID)!;
    return { ...state, buildings: state.buildings.map(building => (building === bakery ? { ...bakery, slotCount: SLOTS } : building)) };
  },
  steps,
};
