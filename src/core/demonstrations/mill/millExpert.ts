import { createBuilding } from '../../buildings/buildingSpecs';
import { interiorLinksOf } from '../../factory/interiorLinks';
import { assignedFixturesOf, type GoodId } from '../../index';
import type { Command } from '../../engine/commands';
import type { FixtureId, Rotation } from '../../engine/state';
import { BUILDING_ID, lineCity, roomOf } from '../lineInterior';
import type { Demonstration, DemonstrationStep, DemonstrationText } from '../scenario';

type Piece = readonly [fixture: FixtureId, x: number, y: number, rotation: Rotation];

const t = (en: string, fr: string): DemonstrationText => [en, fr];

// Seven millstones in two columns: the ones against the right Shaft press olives and grind wheat, the ones on the left only press olives.
const STONES: readonly Piece[] = [
  ['millstone', 5, 0, 3], ['millstone', 5, 2, 3], ['millstone', 5, 4, 3], ['millstone', 5, 6, 3],
  ['millstoneRight', 4, 8, 3], ['millstone', 3, 4, 2], ['millstoneRight', 2, 4, 2],
];

// A Cleaner and a Pump on the left, Pipes that carry the flow between the columns, Baggers for the flour and Oil tanks for the oil.
const FLOW: readonly Piece[] = [
  ['millCleaner', 2, 2, 3], ['millPumpLeft', 3, 2, 3], ['millPipeElbow', 4, 0, 0], ['millPipe', 4, 1, 0],
  ['millPipeCross', 4, 2, 0], ['millPipe', 4, 3, 2], ['millPipeCross', 4, 4, 0], ['millPipe', 4, 5, 0],
  ['millPipeTee', 4, 6, 2], ['millPipeTee', 3, 6, 0], ['millPipe', 3, 7, 0], ['millPipeElbow', 3, 8, 3],
  ['millPipeElbow', 1, 4, 0], ['millPipe', 1, 5, 0], ['millPipeElbow', 1, 6, 3], ['millPipe', 2, 6, 1],
  ['millBagger', 5, 1, 2], ['millBagger', 5, 3, 2], ['millBagger', 5, 5, 2], ['millOilTank', 3, 5, 2],
  ['millOilTank', 5, 7, 2], ['millOilTank', 4, 7, 0], ['millOilTank', 2, 5, 2],
];

// A Motor on the left and a Strong motor on the right; Bevel tees and crosses share their Drive between the millstones.
const DRIVE: readonly Piece[] = [
  ['millMotor', 1, 3, 3], ['millBevelTee', 2, 3, 0], ['millBevelTee', 3, 3, 1], ['millMotorStrong', 7, 0, 1],
  ['millBevel', 6, 0, 1], ['millShaft', 6, 1, 0], ['millBevelCross', 6, 2, 0], ['millBevel', 7, 2, 2],
  ['millShaft', 6, 3, 0], ['millBevelTee', 6, 4, 1], ['millShaft', 6, 5, 0], ['millBevelTee', 6, 6, 1],
  ['millShaft', 6, 7, 0], ['millBevel', 6, 8, 2], ['millShaft', 5, 8, 1],
];

const PIECES: readonly Piece[] = [...STONES, ...FLOW, ...DRIVE];
const idOf = (piece: Piece): number => PIECES.indexOf(piece) + 1;
const RECIPES: readonly string[] = ['oliveOil','flour','flour','oliveOil','oliveOil','oliveOil','oliveOil'];
const ASSIGNED: readonly number[] = [0,1,2,3,6];
const ASSIGNED_STONES = ASSIGNED.map(index => STONES[index]!);
const MILLERS = 5;
const TECHNICIANS = 2;
const SLOTS = 5;

const place = (pieces: readonly Piece[]): Command[] => pieces.map(([fixture, x, y, rotation]) => ({ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture, x, y, rotation }));
const cells = (pieces: readonly Piece[]) => pieces.map(([, x, y]) => ({ x, y }));

interface Expectation {
  placed: number;
  picked?: boolean;
  assigned?: boolean;
}

const check = ({ placed, picked = false, assigned = false }: Expectation): DemonstrationStep['check'] => state => {
  const mill = roomOf(state);
  const fixtures = mill.interior?.fixtures ?? [];
  if (fixtures.length !== placed) throw new Error(`expected ${placed} fixtures, got ${fixtures.length}`);
  const stones = fixtures.filter(fixture => fixture.type === 'millstone' || fixture.type === 'millstoneRight');
  const recipes = stones.map(stone => stone.recipe as string | undefined).join(',');
  if ((recipes === RECIPES.join(',')) !== picked) throw new Error(`expected the recipes picked: ${picked}`);
  if ((assignedFixturesOf(mill.interior, 'miller').length === MILLERS) !== assigned) throw new Error(`expected the millers assigned: ${assigned}`);
  if (assigned && stones.every(stone => !interiorLinksOf(fixtures).linked.has(stone.id))) throw new Error('expected linked millstones');
};

const step = (id: string, title: DemonstrationText, objective: DemonstrationText, action: DemonstrationText, explanation: DemonstrationText, result: DemonstrationText, commands: readonly Command[], highlight: readonly Piece[], expectation: Expectation): DemonstrationStep =>
  ({ id, title, objective, action, explanation, result, commands, highlight: cells(highlight), check: check(expectation) });

const steps: DemonstrationStep[] = [
  {
    id: 'goal', title: t('A whole mill', 'Un moulin complet'), objective: t('Fit out a Tier 5 Mill interior with seven millstones, three baggers and four oil tanks.', 'Équiper un intérieur de moulin de niveau 5 avec sept meules, trois ensacheuses et quatre réservoirs d’huile.'),
    action: t('The room you see is an empty Tier 5 Mill interior. You will build the whole layout in a few steps.', 'La salle que tu vois est un intérieur de moulin de niveau 5, vide. Tu vas construire toute la disposition en quelques étapes.'),
    explanation: t('A Motor and a Strong motor drive the millstones through Bevel tees and crosses, and a Pump pushes the flow to them through Pipes.', 'Un moteur et un moteur puissant entraînent les meules par des renvois en té et en croix, et une pompe leur envoie le fluide par des tuyaux.'),
    result: t('The room is empty.', 'La salle est vide.'), check: check({ placed: 0 }),
  },
  step('stones', t('Seven millstones', 'Sept meules'), t('Place the machines that press and grind.', 'Placer les machines qui pressent et moulent.'), t('Place the seven millstones in two columns.', 'Place les sept meules en deux colonnes.'),
    t('Right-handed and left-handed millstones take their Drive on different sides: pick the one that faces its Shaft.', 'Les meules droitières et gauchères prennent leur force sur des côtés différents : choisis celle qui fait face à son arbre.'),
    t('Nothing runs yet.', 'Rien ne tourne encore.'), place(STONES), STONES, { placed: STONES.length }),
  step('flow', t('Flow, baggers and tanks', 'Fluide, ensacheuses et réservoirs'), t('Feed the millstones and collect their output.', 'Alimenter les meules et recueillir leur production.'), t('Place the Cleaner, the Pump and the Pipes, then the Baggers beside the flour millstones and the Oil tanks beside the oil ones.', 'Place la nettoyeuse, la pompe et les tuyaux, puis les ensacheuses près des meules à farine et les réservoirs d’huile près de celles à huile.'),
    t('Pipe tees and crosses share the flow of one Pump between several millstones, as Bevel gears do with a Drive.', 'Les tuyaux en té et en croix partagent le fluide d’une pompe entre plusieurs meules, comme les renvois coniques le font d’une force.'),
    t('The millstones wait for their drive.', 'Les meules attendent leur force.'), place(FLOW), FLOW, { placed: STONES.length + FLOW.length }),
  step('drive', t('Two motors', 'Deux moteurs'), t('Drive everything.', 'Tout entraîner.'), t('Place the Motor on the left, the Strong motor on the right, and the Shafts and Bevel gears between them.', 'Place le moteur à gauche, le moteur puissant à droite, et les arbres et renvois coniques entre eux.'),
    t('The Strong motor drives the right column and the Pump side; the Motor handles the left.', 'Le moteur puissant entraîne la colonne de droite ; le moteur gère celle de gauche.'),
    t('Every millstone is driven.', 'Chaque meule est entraînée.'), place(DRIVE), DRIVE, { placed: PIECES.length }),
  step('recipes', t('Pick the recipes', 'Choisir les recettes'), t('Say what each millstone makes.', 'Dire ce que fait chaque meule.'), t('Pick olive oil or flour on each millstone.', 'Choisis l’huile d’olive ou la farine sur chaque meule.'),
    t('Two millstones grind wheat next to a Bagger; the others press olives into a tank.', 'Deux meules moulent du blé près d’une ensacheuse ; les autres pressent des olives vers un réservoir.'),
    t('The millstones are set.', 'Les meules sont réglées.'), STONES.map((piece, index): Command => ({ type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId: idOf(piece), good: RECIPES[index] as GoodId })), STONES, { placed: PIECES.length, picked: true }),
  step('hire', t('Hire the staff', 'Embaucher le personnel'), t('Provide the workers.', 'Recruter les employés.'), t('Hire five millers and two technicians.', 'Embauche cinq meuniers et deux techniciens.'),
    t('A miller works at a millstone, and the technicians repair the worn pieces.', 'Un meunier travaille à une meule, et les techniciens réparent les pièces usées.'),
    t('The workers are available.', 'Les employés sont disponibles.'),
    [...Array.from({ length: MILLERS }, (): Command => ({ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'miller' })), ...Array.from({ length: TECHNICIANS }, (): Command => ({ type: 'HireInteriorTechnician', buildingId: BUILDING_ID }))], [], { placed: PIECES.length, picked: true }),
  step('assign', t('Assign the millers', 'Affecter les meuniers'), t('Start the milling.', 'Démarrer la mouture.'), t('Assign a miller to five of the millstones.', 'Affecte un meunier à cinq des meules.'),
    t('A millstone only works once its miller stands at it. Two millstones stay idle until you have more millers.', 'Une meule ne travaille que lorsque son meunier s’y tient. Deux meules restent à l’arrêt tant que tu n’as pas plus de meuniers.'),
    t('The mill works by itself.', 'Le moulin travaille seul.'),
    ASSIGNED_STONES.map((piece): Command => ({ type: 'AssignInteriorStaff', buildingId: BUILDING_ID, fixtureId: idOf(piece) })), ASSIGNED_STONES, { placed: PIECES.length, picked: true, assigned: true }),
];

export const millExpert: Demonstration = {
  id: 'mill-expert', buildingType: 'mill', buildingId: BUILDING_ID, level: 'expert', title: t('Mill — Expert', 'Moulin — Expert'), objective: t('Build a whole mill: seven millstones, three baggers and four oil tanks.', 'Construire un moulin complet : sept meules, trois ensacheuses et quatre réservoirs d’huile.'),
  initial: () => {
    const state = lineCity('mill', 'guided-mill-expert-v1', 5);
    const mill = state.buildings.find(building => building.id === BUILDING_ID)!;
    return { ...state, buildings: [...state.buildings.map(building => (building === mill ? { ...mill, slotCount: SLOTS } : building)), createBuilding(2, 'storehouse', 70, 50, 0)], storage: { ...state.storage, materials: { ...state.storage.materials, olive: 100, wheat: 100 } } };
  },
  steps,
};
