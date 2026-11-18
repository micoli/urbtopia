import { interiorLinksOf } from '../../factory/interiorLinks';
import type { Command } from '../../engine/commands';
import type { FixtureId, Rotation } from '../../engine/state';
import type { GoodId } from '../../index';
import { BUILDING_ID, lineCity, roomOf } from '../lineInterior';
import type { Demonstration, DemonstrationStep, DemonstrationText } from '../scenario';

type Piece = readonly [fixture: FixtureId, x: number, y: number, rotation: Rotation];

const t = (en: string, fr: string): DemonstrationText => [en, fr];

// Two Packers and their Scanners on the left; their Conveyors run along the room and join into a single belt.
const INTAKE: readonly Piece[] = [
  ['packhousePacker', 0, 0, 0], ['packhousePackerLeft', 2, 0, 0], ['packhouseScanner', 0, 2, 0], ['packhouseScanner', 2, 2, 0],
  ['packhouseConveyor', 0, 1, 0], ['packhouseConveyor', 2, 1, 0], ['packhouseConveyorElbowLeft', 0, 3, 0], ['packhouseConveyor', 1, 3, 3],
  ['packhouseConveyorJoinStraightRight', 2, 3, 3], ['packhouseConveyor', 3, 3, 3], ['packhouseConveyor', 4, 3, 3], ['packhouseMotor', 1, 1, 2],
  ['packhouseBevelTee', 1, 0, 0],
];

// The belt splits towards three Strappers and three Exits at the back and on the right.
const BELT: readonly Piece[] = [
  ['packhouseConveyorSplitStraightRight', 5, 3, 3], ['packhouseConveyorSplitStraightLeft', 6, 3, 3], ['packhouseConveyorSplitStraightRight', 7, 3, 3], ['packhouseConveyor', 5, 2, 2],
  ['packhouseConveyor', 7, 2, 2], ['packhouseConveyor', 6, 4, 0], ['packhouseStrapperLeft', 5, 1, 2], ['packhouseStrapper', 7, 1, 2],
  ['packhouseStrapper', 6, 5, 0], ['packhouseStrapperLeft', 8, 3, 3], ['packhouseExitBox', 5, 0, 0], ['packhouseExitPallet', 7, 0, 0],
  ['packhouseExitCrate', 9, 3, 1],
];

// A Motor and Bevel tees drive the Strappers; a second Motor and Shafts reach the lower ones.
const DRIVE: readonly Piece[] = [
  ['packhouseMotor', 6, 2, 2], ['packhouseBevelTee', 6, 1, 0], ['packhouseMotor', 9, 5, 1], ['packhouseBevelTee', 8, 5, 2],
  ['packhouseShaft', 7, 5, 1], ['packhouseShaft', 8, 4, 0],
];

// A last branch carries the rest of the belt to two more Exits at the bottom right.
const BRANCH: readonly Piece[] = [
  ['packhouseConveyorSplitStraightRight', 6, 6, 0], ['packhouseConveyorElbowLeft', 6, 7, 0], ['packhouseConveyor', 7, 7, 3], ['packhouseConveyor', 8, 7, 3],
  ['packhouseConveyor', 7, 6, 3], ['packhouseConveyor', 8, 6, 3], ['packhouseExitPallet', 9, 6, 1], ['packhouseExitBox', 9, 7, 1],
];

const PIECES: readonly Piece[] = [...INTAKE, ...BELT, ...DRIVE, ...BRANCH];
const idOf = (piece: Piece): number => PIECES.indexOf(piece) + 1;
const EXITS = PIECES.filter(piece => piece[0].startsWith('packhouseExit'));
const GOODS: readonly string[] = ['grassBox', 'wheatPallet', 'carrotCrate', 'beetPallet', 'grassBox'];
const RESTOCKED = [EXITS[0]!, EXITS[1]!, EXITS[4]!];
const RESTOCKERS = 3;
const TECHNICIANS = 2;
const SLOTS = 4;

const place = (pieces: readonly Piece[]): Command[] => pieces.map(([fixture, x, y, rotation]) => ({ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture, x, y, rotation }));
const cells = (pieces: readonly Piece[]) => pieces.map(([, x, y]) => ({ x, y }));

interface Expectation {
  placed: number;
  picked?: boolean;
  assigned?: boolean;
}

const check = ({ placed, picked = false, assigned = false }: Expectation): DemonstrationStep['check'] => state => {
  const packhouse = roomOf(state);
  const fixtures = packhouse.interior?.fixtures ?? [];
  if (fixtures.length !== placed) throw new Error(`expected ${placed} fixtures, got ${fixtures.length}`);
  const exits = fixtures.filter(fixture => fixture.type.startsWith('packhouseExit'));
  if ((exits.map(exit => exit.restock as string | undefined).join(',') === GOODS.join(',')) !== picked) throw new Error(`expected the goods picked: ${picked}`);
  if ((exits.filter(exit => exit.restocker === true).length === RESTOCKED.length) !== assigned) throw new Error(`expected the restockers assigned: ${assigned}`);
  if (assigned && interiorLinksOf(fixtures).lined.size === 0) throw new Error('expected a Line');
};

const step = (id: string, title: DemonstrationText, objective: DemonstrationText, action: DemonstrationText, explanation: DemonstrationText, result: DemonstrationText, commands: readonly Command[], highlight: readonly Piece[], expectation: Expectation): DemonstrationStep =>
  ({ id, title, objective, action, explanation, result, commands, highlight: cells(highlight), check: check(expectation) });

const steps: DemonstrationStep[] = [
  {
    id: 'goal', title: t('A whole packhouse', 'Un conditionnement complet'), objective: t('Fit out a Tier 5 Packhouse interior with two Packers, three Strappers and five Exits.', 'Équiper un intérieur de conditionnement de niveau 5 avec deux emballeuses, trois cercleuses et cinq sorties.'),
    action: t('The room you see is an empty Tier 5 Packhouse interior. You will build the whole layout in a few steps.', 'La salle que tu vois est un intérieur de conditionnement de niveau 5, vide. Tu vas construire toute la disposition en quelques étapes.'),
    explanation: t('Two Packers fill one belt, which splits towards the Strappers and the Exits. Two Motors drive the machines through Bevel tees and Shafts.', 'Deux emballeuses remplissent un seul tapis, qui se divise vers les cercleuses et les sorties. Deux moteurs entraînent les machines par des renvois en té et des arbres.'),
    result: t('The room is empty.', 'La salle est vide.'), check: check({ placed: 0 }),
  },
  step('intake', t('Packers and scanners', 'Emballeuses et scanners'), t('Start the belt.', 'Démarrer le tapis.'), t('Place the two Packers with their Scanners, their Conveyors, the joining Conveyor, the Motor and its Bevel tee.', 'Place les deux emballeuses avec leurs scanners, leurs tapis, le tapis joigneur, le moteur et son renvoi en té.'),
    t('The joining Conveyor takes the second Packer in at its side, so one belt carries both.', 'Le tapis joigneur prend la seconde emballeuse par son côté, si bien qu’un seul tapis porte les deux.'),
    t('Both Packers feed one belt.', 'Les deux emballeuses alimentent un seul tapis.'), place(INTAKE), INTAKE, { placed: INTAKE.length }),
  step('belt', t('Split the belt', 'Diviser le tapis'), t('Reach the Strappers and the Exits.', 'Atteindre les cercleuses et les sorties.'), t('Place the split Conveyors, the three Strappers and the first three Exits.', 'Place les tapis diviseurs, les trois cercleuses et les trois premières sorties.'),
    t('A split Conveyor sends the goods to both sides in turn.', 'Un tapis diviseur envoie les produits des deux côtés tour à tour.'),
    t('The belt reaches the Strappers.', 'Le tapis atteint les cercleuses.'), place(BELT), BELT, { placed: INTAKE.length + BELT.length }),
  step('drive', t('Drive the Strappers', 'Entraîner les cercleuses'), t('Give them power.', 'Leur donner de la force.'), t('Place the second Motor, the Bevel tees and the Shafts.', 'Place le second moteur, les renvois en té et les arbres.'),
    t('Each Strapper needs a Drive: the Bevel tees share it between the Shafts that reach them.', 'Chaque cercleuse a besoin de force : les renvois en té la partagent entre les arbres qui les atteignent.'),
    t('Every machine is driven.', 'Chaque machine est entraînée.'), place(DRIVE), DRIVE, { placed: INTAKE.length + BELT.length + DRIVE.length }),
  step('branch', t('A last branch', 'Une dernière branche'), t('Add two more Exits.', 'Ajouter deux sorties.'), t('Place the Conveyors and the last two Exits at the bottom right.', 'Place les tapis et les deux dernières sorties en bas à droite.'),
    t('The split Conveyor at the bottom shares the belt with the branch, and an elbow turns it towards the Exits.', 'Le tapis diviseur du bas partage le tapis avec la branche, et un coude le tourne vers les sorties.'),
    t('Five Exits are reached.', 'Cinq sorties sont atteintes.'), place(BRANCH), BRANCH, { placed: PIECES.length }),
  step('goods', t('Pick the goods', 'Choisir les produits'), t('Say what each Exit packs.', 'Dire ce que conditionne chaque sortie.'), t('Pick grass box, wheat pallet, carrot crate, beet pallet and grass box again.', 'Choisis la caisse d’herbe, la palette de blé, la cagette de carottes, la palette de betteraves et de nouveau la caisse d’herbe.'),
    t('Each Exit packs one kind of good in one kind of container.', 'Chaque sortie conditionne un produit dans un contenant.'),
    t('The Exits are set.', 'Les sorties sont réglées.'), EXITS.map((piece, index): Command => ({ type: 'SetExitRestock', buildingId: BUILDING_ID, fixtureId: idOf(piece), good: GOODS[index] as GoodId })), EXITS, { placed: PIECES.length, picked: true }),
  step('hire', t('Hire the staff', 'Embaucher le personnel'), t('Provide the workers.', 'Recruter les employés.'), t('Hire three restockers and two technicians.', 'Embauche trois réapprovisionneurs et deux techniciens.'),
    t('A restocker brings the containers to an Exit, and the technicians repair the worn pieces.', 'Un réapprovisionneur apporte les contenants à une sortie, et les techniciens réparent les pièces usées.'),
    t('The workers are available.', 'Les employés sont disponibles.'),
    [...Array.from({ length: RESTOCKERS }, (): Command => ({ type: 'HireInteriorRestocker', buildingId: BUILDING_ID })), ...Array.from({ length: TECHNICIANS }, (): Command => ({ type: 'HireInteriorTechnician', buildingId: BUILDING_ID }))], [], { placed: PIECES.length, picked: true }),
  step('assign', t('Assign the restockers', 'Affecter les réapprovisionneurs'), t('Keep the Exits supplied.', 'Garder les sorties approvisionnées.'), t('Assign a restocker to three of the Exits.', 'Affecte un réapprovisionneur à trois des sorties.'),
    t('An Exit is only supplied while its restocker stands at it. The two others wait for more restockers.', 'Une sortie n’est approvisionnée que tant que son réapprovisionneur s’y tient. Les deux autres attendent d’autres réapprovisionneurs.'),
    t('The packhouse works by itself.', 'Le conditionnement travaille seul.'),
    RESTOCKED.map((piece): Command => ({ type: 'AssignInteriorRestocker', buildingId: BUILDING_ID, fixtureId: idOf(piece) })), RESTOCKED, { placed: PIECES.length, picked: true, assigned: true }),
];

export const packhouseExpert: Demonstration = {
  id: 'packhouse-expert', buildingType: 'packhouse', buildingId: BUILDING_ID, level: 'expert', title: t('Packhouse — Expert', 'Conditionnement — Expert'), objective: t('Build a whole packhouse: two Packers, three Strappers and five Exits.', 'Construire un conditionnement complet : deux emballeuses, trois cercleuses et cinq sorties.'),
  initial: () => {
    const state = lineCity('packhouse', 'guided-packhouse-expert-v1', 5);
    const packhouse = state.buildings.find(building => building.id === BUILDING_ID)!;
    return { ...state, buildings: state.buildings.map(building => (building === packhouse ? { ...packhouse, slotCount: SLOTS } : building)) };
  },
  steps,
};
