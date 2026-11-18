import { farmFieldCapOf } from '../../farming/farmInterior';
import { farmTier } from '../../economy/tiers';
import { interiorLinksOf } from '../../factory/interiorLinks';
import { assignedFixturesOf, interiorBonusOfBuilding, type GoodId } from '../../index';
import type { Command } from '../../engine/commands';
import type { FixtureId, Rotation } from '../../engine/state';
import { BUILDING_ID, lineCity, roomOf } from '../lineInterior';
import type { Demonstration, DemonstrationStep, DemonstrationText } from '../scenario';

type Piece = readonly [fixture: FixtureId, x: number, y: number, rotation: Rotation];

const t = (en: string, fr: string): DemonstrationText => [en, fr];

// The harvest Line: from the Intake, through the Washer, the Thresher and the Grader, a splitting Conveyor sends the crop to a Harvest bin straight on and, by a Conveyor and an elbow, to a second one.
const LINE: readonly Piece[] = [
  ['farmIntake', 1, 0, 0], ['farmWasherLeft', 1, 1, 0], ['farmThresher', 1, 2, 0], ['farmGrader', 1, 3, 0], ['farmConveyorSplitStraightRight', 1, 4, 0],
  ['farmHarvestBin', 1, 5, 2], ['farmConveyor', 2, 4, 3], ['farmConveyorElbowRight', 3, 4, 3], ['farmHarvestBin', 3, 5, 2],
];

// One Motor drives everything: a Bevel tee splits its Drive between the Shafts that run along the front wall to the Pump and those that climb to the row of the Thresher and the Grader.
const DRIVE: readonly Piece[] = [
  ['farmMotor', 8, 7, 1], ['farmBevelTee', 7, 7, 2],
  ['farmShaft', 6, 7, 1], ['farmShaft', 5, 7, 1], ['farmShaft', 4, 7, 1], ['farmShaft', 3, 7, 1], ['farmShaft', 2, 7, 1], ['farmShaft', 1, 7, 1],
  ['farmShaft', 7, 6, 2], ['farmShaft', 7, 5, 2], ['farmShaft', 7, 4, 0], ['farmBevel', 7, 3, 1],
  ['farmShaft', 6, 3, 1], ['farmShaft', 5, 3, 1], ['farmShaft', 4, 3, 1], ['farmShaft', 3, 3, 1], ['farmBevelTee', 2, 3, 2], ['farmBevel', 2, 2, 1],
];

// One Tank and one Pump: the Pipes climb along the wall to the Washer and run along the row of the Sprinklers.
const WATER: readonly Piece[] = [
  ['farmTank', 0, 8, 2], ['farmPumpLeft', 0, 7, 2], ['farmPipeTee', 0, 6, 3], ['farmPipe', 0, 5, 0], ['farmPipe', 0, 4, 0], ['farmPipe', 0, 3, 0], ['farmPipe', 0, 2, 0], ['farmPipeElbow', 0, 1, 0],
  ['farmPipe', 1, 6, 1], ['farmPipe', 2, 6, 1], ['farmPipe', 3, 6, 1], ['farmPipe', 4, 6, 1], ['farmPipeTee', 5, 6, 2], ['farmPipeElbow', 6, 6, 2],
];

const SPRINKLERS: readonly Piece[] = [['farmSprinkler', 5, 5, 1], ['farmSprinkler', 6, 5, 1]];

const PIECES: readonly Piece[] = [...LINE, ...DRIVE, ...WATER, ...SPRINKLERS];
const idOf = (piece: Piece): number => PIECES.indexOf(piece) + 1;
const BINS = LINE.filter(piece => piece[0] === 'farmHarvestBin');
const CROPS: readonly string[] = ['flower', 'wheat'];
const FARMHANDS = 3;
const IRRIGATORS = 4;

const place = (pieces: readonly Piece[]): Command[] => pieces.map(([fixture, x, y, rotation]) => ({ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture, x, y, rotation }));
const cells = (pieces: readonly Piece[]) => pieces.map(([, x, y]) => ({ x, y }));

interface Expectation {
  placed: number;
  lined?: boolean;
  watered?: boolean;
  staffed?: boolean;
  crops?: boolean;
}

const check = ({ placed, lined = false, watered = false, staffed = false, crops = false }: Expectation): DemonstrationStep['check'] => state => {
  const farm = roomOf(state);
  const fixtures = farm.interior?.fixtures ?? [];
  if (fixtures.length !== placed) throw new Error(`expected ${placed} fixtures, got ${fixtures.length}`);
  const links = interiorLinksOf(fixtures);
  const bins = fixtures.filter(fixture => fixture.type === 'farmHarvestBin');
  if (bins.length > 0 && bins.every(bin => links.lined.has(bin.id)) !== lined) throw new Error(`expected every bin connected: ${lined}`);
  const sprinklers = fixtures.filter(fixture => fixture.type === 'farmSprinkler');
  if (sprinklers.length > 0 && sprinklers.every(sprinkler => links.linked.has(sprinkler.id)) !== watered) throw new Error(`expected every sprinkler watered: ${watered}`);
  const assigned = assignedFixturesOf(farm.interior, 'farmhand').length + assignedFixturesOf(farm.interior, 'irrigator').length;
  if ((assigned === BINS.length + SPRINKLERS.length) !== staffed) throw new Error(`expected the staff assigned: ${staffed}`);
  const picked = bins.map(bin => bin.recipe as string | undefined).join(',');
  if ((picked === CROPS.join(',')) !== crops) throw new Error(`expected the crops picked: ${crops}`);
  if (staffed && lined && interiorBonusOfBuilding(farm).yield <= 0) throw new Error('expected a yield bonus');
  if (staffed && watered && farmFieldCapOf(farm) <= farmTier(farm).fieldCap) throw new Error('expected a Field cap bonus');
};

const step = (id: string, title: DemonstrationText, objective: DemonstrationText, action: DemonstrationText, explanation: DemonstrationText, result: DemonstrationText, commands: readonly Command[], highlight: readonly Piece[], expectation: Expectation): DemonstrationStep =>
  ({ id, title, objective, action, explanation, result, commands, highlight: cells(highlight), check: check(expectation) });

const steps: DemonstrationStep[] = [
  {
    id: 'goal', title: t('A whole farm', 'Une ferme complète'), objective: t('Fit out a Tier 5 Farm interior with two harvest bins and two sprinklers.', 'Équiper un intérieur de ferme de niveau 5 avec deux bacs de récolte et deux arroseurs.'),
    action: t('The room you see is an empty Tier 5 Farm interior. You will build the whole layout in a few steps.', 'La salle que tu vois est un intérieur de ferme de niveau 5, vide. Tu vas construire toute la disposition en quelques étapes.'),
    explanation: t('One Motor and one Tank serve two circuits: a harvest line that splits toward two bins, and the irrigation of two sprinklers.', 'Un seul moteur et un seul réservoir servent deux circuits : une chaîne de récolte qui se divise vers deux bacs, et l’irrigation de deux arroseurs.'),
    result: t('The room is empty.', 'La salle est vide.'), check: check({ placed: 0 }),
  },
  step('line', t('The harvest line', 'La chaîne de récolte'), t('Carry the harvest to two bins.', 'Porter la récolte jusqu’à deux bacs.'), t('Place the intake, the left-handed washer, the thresher, the grader, the splitting conveyor, the conveyor and the elbow, and the two harvest bins.', 'Place l’entrée, la laveuse gauchère, la batteuse, la calibreuse, le tapis répartiteur, le tapis et le coude, puis les deux bacs de récolte.'),
    t('The splitting conveyor sends the harvest straight on to the first bin and sideways, by a conveyor and an elbow, to the second.', 'Le tapis répartiteur envoie la récolte tout droit vers le premier bac et sur le côté, par un tapis et un coude, vers le second.'),
    t('Nothing runs yet: the machines have no drive and no water.', 'Rien ne tourne encore : les machines n’ont ni force ni eau.'), place(LINE), LINE, { placed: LINE.length }),
  step('drive', t('One motor, all the drive', 'Un moteur pour toute la force'), t('Give the thresher and the grader their drive.', 'Donner leur force à la batteuse et à la calibreuse.'), t('Place the motor, the shafts and the two bevel tees and bevels.', 'Place le moteur, les arbres, les deux renvois en té et les renvois d’angle.'),
    t('A bevel tee splits the drive: one branch runs along the front wall toward the pump, the other climbs to the row of the thresher and the grader.', 'Un renvoi en té partage la force : une branche longe le mur avant vers la pompe, l’autre monte vers la rangée de la batteuse et de la calibreuse.'),
    t('The thresher and the grader turn.', 'La batteuse et la calibreuse tournent.'), place(DRIVE), DRIVE, { placed: LINE.length + DRIVE.length }),
  step('water', t('One tank, all the water', 'Un réservoir pour toute l’eau'), t('Bring the water to the washer.', 'Amener l’eau à la laveuse.'), t('Place the tank, the pump and the pipes.', 'Place le réservoir, la pompe et les tuyaux.'),
    t('The pump, driven by the same motor, pushes the tank’s water through the pipes: they climb to the washer, which sits on the line, and run on along the row where the sprinklers will stand.', 'La pompe, entraînée par le même moteur, pousse l’eau du réservoir dans les tuyaux : ils montent jusqu’à la laveuse, sur la chaîne, et filent le long de la rangée des futurs arroseurs.'),
    t('Both bins are now reached by a complete line.', 'Les deux bacs sont maintenant atteints par une chaîne complète.'), place(WATER), WATER, { placed: LINE.length + DRIVE.length + WATER.length, lined: true }),
  step('sprinklers', t('Two sprinklers', 'Deux arroseurs'), t('Water the fields.', 'Arroser les champs.'), t('Place the two sprinklers against the pipes.', 'Place les deux arroseurs contre les tuyaux.'),
    t('The tank feeds three machines that take water: the washer and the two sprinklers fill it exactly.', 'Le réservoir alimente trois machines qui veulent de l’eau : la laveuse et les deux arroseurs le remplissent exactement.'),
    t('The sprinklers are watered.', 'Les arroseurs sont arrosés.'), place(SPRINKLERS), SPRINKLERS, { placed: PIECES.length, lined: true, watered: true }),
  step('hire', t('Hire the staff', 'Embaucher le personnel'), t('Provide the workers.', 'Recruter les employés.'), t('Hire three farmhands, four irrigators and a technician.', 'Embauche trois ouvriers agricoles, quatre irrigateurs et un technicien.'),
    t('The farmhands deliver the yield bonus and harvest, the irrigators deliver the Field bonus, and the technician repairs the worn pieces.', 'Les ouvriers agricoles délivrent le bonus de rendement et récoltent, les irrigateurs délivrent le bonus de parcelles, et le technicien répare les pièces usées.'),
    t('The workers are available.', 'Les employés sont disponibles.'),
    [...Array.from({ length: FARMHANDS }, (): Command => ({ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'farmhand' })), ...Array.from({ length: IRRIGATORS }, (): Command => ({ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'irrigator' })), { type: 'HireInteriorTechnician', buildingId: BUILDING_ID }],
    [], { placed: PIECES.length, lined: true, watered: true }),
  step('assign', t('Assign the workers', 'Affecter les employés'), t('Put them at the bins and the sprinklers.', 'Les mettre aux bacs et aux arroseurs.'), t('Assign a farmhand to each bin and an irrigator to each sprinkler.', 'Affecte un ouvrier agricole à chaque bac et un irrigateur à chaque arroseur.'),
    t('A bin or a sprinkler counts only once its worker stands at it. One worker serves one piece: a farmhand and two irrigators stay free.', 'Un bac ou un arroseur ne compte que lorsque son employé s’y tient. Un employé sert une pièce : un ouvrier agricole et deux irrigateurs restent libres.'),
    t('Every Harvest gives more, and the Farm holds more Fields.', 'Chaque récolte donne plus, et la ferme porte plus de parcelles.'),
    [...BINS, ...SPRINKLERS].map((piece): Command => ({ type: 'AssignInteriorStaff', buildingId: BUILDING_ID, fixtureId: idOf(piece) })), [...BINS, ...SPRINKLERS], { placed: PIECES.length, lined: true, watered: true, staffed: true }),
  step('crops', t('Pick the crops', 'Choisir les cultures'), t('Say what each farmhand harvests.', 'Dire ce que chaque ouvrier agricole récolte.'), t('Pick flowers on the first bin and wheat on the second.', 'Choisis les fleurs sur le premier bac et le blé sur le second.'),
    t('Each farmhand harvests by himself the ready Fields of his crop, anywhere in the city. Play the demonstration to watch the Fields empty.', 'Chaque ouvrier agricole récolte seul les parcelles prêtes de sa culture, partout dans la ville. Lance la démonstration pour voir les parcelles se vider.'),
    t('The farm works by itself.', 'La ferme travaille seule.'),
    BINS.map((piece, index): Command => ({ type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId: idOf(piece), good: CROPS[index] as GoodId })), BINS, { placed: PIECES.length, lined: true, watered: true, staffed: true, crops: true }),
];

export const farmExpert: Demonstration = {
  id: 'farm-expert', buildingType: 'farm', buildingId: BUILDING_ID, level: 'expert', title: t('Farm — Expert', 'Ferme — Expert'), objective: t('Build a whole farm: two harvest bins, two sprinklers, one motor and one tank.', 'Construire une ferme complète : deux bacs de récolte, deux arroseurs, un moteur et un réservoir.'),
  initial: () => ({
    ...lineCity('farm', 'guided-farm-expert-v1', 5),
    fields: Array.from({ length: 8 }, (_, index) => ({ x: 40 + index, y: 50, crop: { species: index % 2 === 0 ? ('flower' as const) : ('wheat' as const), plantedAt: 0 } })),
  }),
  steps,
};
