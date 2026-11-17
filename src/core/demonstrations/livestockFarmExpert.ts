import { interiorLinksOf } from '../factory/interiorLinks';
import { createBuilding } from '../buildings/buildingSpecs';
import { assignedFixturesOf, type GoodId } from '../index';
import type { Command } from '../engine/commands';
import type { FixtureId, Rotation } from '../engine/state';
import { BUILDING_ID, lineCity, roomOf } from './lineInterior';
import type { Demonstration, DemonstrationStep, DemonstrationText } from './scenario';

type Piece = readonly [fixture: FixtureId, x: number, y: number, rotation: Rotation];

const t = (en: string, fr: string): DemonstrationText => [en, fr];

// Five columns of feeding: an Intake at the back wall, a Feeder and a Pen. The Intakes and the Packers alternate between right-handed and left-handed pieces to match the Drive that reaches them.
const PENS: readonly Piece[] = [
  ['livestockFeedIntake', 0, 0, 0], ['livestockFeeder', 0, 1, 2], ['livestockPen', 0, 2, 0],
  ['livestockFeedIntakeLeft', 2, 0, 0], ['livestockFeeder', 2, 1, 2], ['livestockPen', 2, 2, 0],
  ['livestockFeedIntakeLeft', 4, 0, 0], ['livestockFeeder', 4, 1, 2], ['livestockPen', 4, 2, 0],
  ['livestockFeedIntake', 5, 0, 0], ['livestockFeeder', 5, 1, 2], ['livestockPen', 5, 2, 0],
  ['livestockFeedIntakeLeft', 7, 0, 0], ['livestockFeeder', 7, 1, 2], ['livestockPen', 7, 2, 0],
];

// Under each Pen, a Conveyor, a Packer and a Collection exit that faces the front wall.
const COLLECTION: readonly Piece[] = [
  ['livestockConveyor', 0, 3, 0], ['livestockPacker', 0, 4, 0], ['livestockCollectionExit', 0, 5, 2],
  ['livestockConveyor', 2, 3, 0], ['livestockPackerLeft', 2, 4, 0], ['livestockCollectionExit', 2, 5, 2],
  ['livestockConveyor', 4, 3, 0], ['livestockPackerLeft', 4, 4, 0], ['livestockCollectionExit', 4, 5, 2],
  ['livestockConveyor', 5, 3, 0], ['livestockPacker', 5, 4, 0], ['livestockCollectionExit', 5, 5, 2],
  ['livestockConveyor', 7, 3, 0], ['livestockPackerLeft', 7, 4, 0], ['livestockCollectionExit', 7, 5, 2],
];

// A Strong motor in the front left corner: a Bevel tee and a Bevel cross share its Drive between the Shafts that climb between the columns of Intakes, Feeders and Packers.
const LEFT_DRIVE: readonly Piece[] = [
  ['livestockMotorStrong', 0, 7, 0], ['livestockBevel', 1, 6, 3], ['livestockShaft', 1, 5, 0], ['livestockBevelCross', 1, 4, 0], ['livestockShaft', 1, 3, 0], ['livestockShaft', 1, 2, 0], ['livestockShaft', 1, 1, 0], ['livestockBevelTee', 1, 0, 0],
  ['livestockShaft', 2, 6, 1], ['livestockShaft', 2, 7, 1], ['livestockBevelCross', 3, 6, 3], ['livestockBevel', 3, 7, 2], ['livestockBevelTee', 3, 4, 3], ['livestockShaft', 3, 5, 0], ['livestockShaft', 3, 3, 0], ['livestockShaft', 3, 2, 0], ['livestockShaft', 3, 1, 0], ['livestockBevel', 3, 0, 0],
];

// A second Strong motor at the front right does the same for the two columns on the right.
const RIGHT_DRIVE: readonly Piece[] = [
  ['livestockShaft', 4, 6, 1], ['livestockBevelTee', 5, 6, 0], ['livestockBevel', 5, 7, 3], ['livestockMotorStrong', 6, 7, 2], ['livestockBevel', 6, 6, 2],
  ['livestockBevelCross', 6, 4, 0], ['livestockShaft', 6, 5, 0], ['livestockShaft', 6, 3, 0], ['livestockShaft', 6, 2, 0], ['livestockShaft', 6, 1, 0], ['livestockBevelTee', 6, 0, 0],
];

const PIECES: readonly Piece[] = [...PENS, ...COLLECTION, ...LEFT_DRIVE, ...RIGHT_DRIVE];
const idOf = (piece: Piece): number => PIECES.indexOf(piece) + 1;
const pensOf = (pieces: readonly Piece[]) => pieces.filter(piece => piece[0] === 'livestockPen');
const exitsOf = (pieces: readonly Piece[]) => pieces.filter(piece => piece[0] === 'livestockCollectionExit');
const PENS_ONLY = pensOf(PENS);
const EXITS = exitsOf(COLLECTION);
const PRODUCTS: readonly string[] = ['henEgg', 'duckEgg', 'milk', 'wool', 'silk'];
const HERDERS = 3;
const SLOTS = 5;
const ASSIGNED_EXIT = EXITS.at(-1)!;

const place = (pieces: readonly Piece[]): Command[] => pieces.map(([fixture, x, y, rotation]) => ({ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture, x, y, rotation }));
const cells = (pieces: readonly Piece[]) => pieces.map(([, x, y]) => ({ x, y }));

interface Expectation {
  placed: number;
  lined?: boolean;
  assigned?: boolean;
  products?: boolean;
}

const check = ({ placed, lined = false, assigned = false, products = false }: Expectation): DemonstrationStep['check'] => state => {
  const farm = roomOf(state);
  const fixtures = farm.interior?.fixtures ?? [];
  if (fixtures.length !== placed) throw new Error(`expected ${placed} fixtures, got ${fixtures.length}`);
  const links = interiorLinksOf(fixtures);
  const exits = fixtures.filter(fixture => fixture.type === 'livestockCollectionExit');
  if (exits.length > 0 && exits.every(exit => links.lined.has(exit.id)) !== lined) throw new Error(`expected every exit connected: ${lined}`);
  if ((assignedFixturesOf(farm.interior, 'herder').length === 1) !== assigned) throw new Error(`expected the herder assigned: ${assigned}`);
  const picked = fixtures.filter(fixture => fixture.type === 'livestockPen').map(pen => pen.recipe as string | undefined).join(',');
  if ((picked === PRODUCTS.join(',')) !== products) throw new Error(`expected the products picked: ${products}`);
};

const step = (id: string, title: DemonstrationText, objective: DemonstrationText, action: DemonstrationText, explanation: DemonstrationText, result: DemonstrationText, commands: readonly Command[], highlight: readonly Piece[], expectation: Expectation): DemonstrationStep =>
  ({ id, title, objective, action, explanation, result, commands, highlight: cells(highlight), check: check(expectation) });

const steps: DemonstrationStep[] = [
  {
    id: 'goal', title: t('A whole livestock farm', 'Un élevage complet'), objective: t('Fit out a Tier 3 Livestock farm interior with five pens and five collection exits.', 'Équiper un intérieur d’élevage de niveau 3 avec cinq enclos et cinq sorties de collecte.'),
    action: t('The room you see is an empty Tier 3 Livestock farm interior. You will build the whole layout in a few steps.', 'La salle que tu vois est un intérieur d’élevage de niveau 3, vide. Tu vas construire toute la disposition en quelques étapes.'),
    explanation: t('Five columns of feeding and collection stand side by side. Two Strong motors, shared by Bevel tees and crosses, drive all of them.', 'Cinq colonnes de nourrissage et de collecte se tiennent côte à côte. Deux moteurs puissants, partagés par des renvois en té et en croix, les entraînent toutes.'),
    result: t('The room is empty.', 'La salle est vide.'), check: check({ placed: 0 }),
  },
  step('pens', t('Five feeding columns', 'Cinq colonnes de nourrissage'), t('Feed five pens.', 'Nourrir cinq enclos.'), t('Place an intake, a feeder and a pen in each of the five columns.', 'Place une entrée de fourrage, une mangeoire et un enclos dans chacune des cinq colonnes.'),
    t('Intakes come in a right-handed and a left-handed model: pick the one whose input faces the shaft that will drive it.', 'Les entrées existent en version droitière et gauchère : choisis celle dont l’entrée fait face à l’arbre qui l’entraînera.'),
    t('Nothing runs yet: the intakes have no drive.', 'Rien ne tourne encore : les entrées n’ont pas de force.'), place(PENS), PENS, { placed: PENS.length }),
  step('collection', t('Five collection lines', 'Cinq chaînes de collecte'), t('Carry the production to five exits.', 'Porter la production jusqu’à cinq sorties.'), t('Under each pen, place a conveyor, a packer and a collection exit.', 'Sous chaque enclos, place un tapis, une emballeuse et une sortie de collecte.'),
    t('The packers need drive, like the intakes. Their exits face the front wall.', 'Les emballeuses ont besoin de force, comme les entrées. Leurs sorties font face au mur avant.'),
    t('The lines wait for their drive.', 'Les chaînes attendent leur force.'), place(COLLECTION), COLLECTION, { placed: PENS.length + COLLECTION.length }),
  step('left-drive', t('The left strong motor', 'Le moteur puissant de gauche'), t('Drive the first columns.', 'Entraîner les premières colonnes.'), t('Place the strong motor in the front left corner, then the bevel gears and the shafts that climb between the columns.', 'Place le moteur puissant dans le coin avant gauche, puis les renvois coniques et les arbres qui montent entre les colonnes.'),
    t('A strong motor drives up to five machines. The bevel crosses and tees take its drive in a side and give it to the others, so one motor reaches many columns.', 'Un moteur puissant entraîne jusqu’à cinq machines. Les renvois en croix et en té prennent sa force par un côté et la donnent aux autres, si bien qu’un moteur atteint plusieurs colonnes.'),
    t('The first columns turn.', 'Les premières colonnes tournent.'), place(LEFT_DRIVE), LEFT_DRIVE, { placed: PENS.length + COLLECTION.length + LEFT_DRIVE.length }),
  step('right-drive', t('The right strong motor', 'Le moteur puissant de droite'), t('Drive the last columns.', 'Entraîner les dernières colonnes.'), t('Place the second strong motor in the front right corner, with its bevel gears and its shafts.', 'Place le second moteur puissant dans le coin avant droit, avec ses renvois coniques et ses arbres.'),
    t('One motor would not drive ten machines: the second takes the columns on the right, and the shaft between the two circuits joins them.', 'Un seul moteur n’entraînerait pas dix machines : le second prend les colonnes de droite, et l’arbre entre les deux circuits les relie.'),
    t('Every exit is reached by a complete line.', 'Chaque sortie est atteinte par une chaîne complète.'), place(RIGHT_DRIVE), RIGHT_DRIVE, { placed: PIECES.length, lined: true }),
  step('products', t('Pick the products', 'Choisir les produits'), t('Say what each pen holds.', 'Dire ce que contient chaque enclos.'), t('Pick hen eggs, duck eggs, milk, wool and silk, from the first pen to the last.', 'Choisis les œufs de poule, les œufs de cane, le lait, la laine et la soie, du premier enclos au dernier.'),
    t('Each pen holds one animal for one product. Five pens make five different goods.', 'Chaque enclos accueille un animal pour un produit. Cinq enclos font cinq produits différents.'),
    t('The pens are set.', 'Les enclos sont réglés.'), PENS_ONLY.map((piece, index): Command => ({ type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId: idOf(piece), good: PRODUCTS[index] as GoodId })), PENS_ONLY, { placed: PIECES.length, lined: true, products: true }),
  step('hire', t('Hire the staff', 'Embaucher le personnel'), t('Provide the workers.', 'Recruter les employés.'), t('Hire three herders and a technician.', 'Embauche trois éleveurs et un technicien.'),
    t('A herder collects the production at an exit, and the technician repairs the worn pieces.', 'Un éleveur collecte la production à une sortie, et le technicien répare les pièces usées.'),
    t('The workers are available.', 'Les employés sont disponibles.'),
    [...Array.from({ length: HERDERS }, (): Command => ({ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'herder' })), { type: 'HireInteriorTechnician', buildingId: BUILDING_ID }], [], { placed: PIECES.length, lined: true, products: true }),
  step('assign', t('Assign a herder', 'Affecter un éleveur'), t('Start the collection.', 'Démarrer la collecte.'), t('Assign a herder to the last collection exit.', 'Affecte un éleveur à la dernière sortie de collecte.'),
    t('An exit collects only once its herder stands at it. The other herders stay free for the other exits.', 'Une sortie ne collecte que lorsque son éleveur s’y tient. Les autres éleveurs restent libres pour les autres sorties.'),
    t('The farm collects by itself.', 'L’élevage collecte seul.'),
    [{ type: 'AssignInteriorStaff', buildingId: BUILDING_ID, fixtureId: idOf(ASSIGNED_EXIT) }], [ASSIGNED_EXIT], { placed: PIECES.length, lined: true, products: true, assigned: true }),
];

export const livestockFarmExpert: Demonstration = {
  id: 'livestockFarm-expert', buildingType: 'livestockFarm', buildingId: BUILDING_ID, level: 'expert', title: t('Livestock farm — Expert', 'Élevage — Expert'), objective: t('Build a whole livestock farm: five pens, five collection exits and two strong motors.', 'Construire un élevage complet : cinq enclos, cinq sorties de collecte et deux moteurs puissants.'),
  initial: () => {
    const state = lineCity('livestockFarm', 'guided-livestock-expert-v1', 3);
    const farm = state.buildings.find(building => building.id === BUILDING_ID)!;
    return { ...state, buildings: [...state.buildings.map(building => (building === farm ? { ...farm, slotCount: SLOTS } : building)), { ...createBuilding(2, 'storehouse', 70, 50, 0), tier: 5 }], storage: { ...state.storage, materials: { ...state.storage.materials, wheat: 10 } } };
  },
  steps,
};
