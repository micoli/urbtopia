import { farmTier } from '../economy/tiers';
import { farmFieldCapOf } from '../farming/farmInterior';
import { interiorLinksOf } from '../factory/interiorLinks';
import { assignedFixturesOf, interiorBonusOfBuilding } from '../index';
import type { FixtureId, Rotation } from '../engine/state';
import type { GoodId } from '../economy/items';
import { BUILDING_ID, lineCity, roomOf } from './lineInterior';
import { levelTitle, placeTitle, type LevelIntro } from './guidedLevel';
import type { Demonstration, DemonstrationStep, DemonstrationText, GuidedLevel } from './scenario';

export type FarmPiece = { id: string; fixture: FixtureId; x: number; y: number; rotation: Rotation; label: DemonstrationText; explanation: DemonstrationText };

export const farmPiece = (id: string, fixture: FixtureId, x: number, y: number, rotation: Rotation, label: DemonstrationText, explanation: DemonstrationText): FarmPiece => ({ id, fixture, x, y, rotation, label, explanation });

const t = (en: string, fr: string): DemonstrationText => [en, fr];

const CROP = 'wheat';
const FACING = [t('the front wall', 'le mur avant'), t('left', 'la gauche'), t('the back wall', 'le mur du fond'), t('right', 'la droite')];

export const farmLabels = {
  intake: t('the intake', 'l’entrée de récolte'), motor: t('a motor', 'un moteur'), washer: t('the washer', 'la laveuse'), thresher: t('the thresher', 'la batteuse'), grader: t('the grader', 'la calibreuse'),
  bin: t('the harvest bin', 'le bac de récolte'), tank: t('a tank', 'un réservoir'), pump: t('a pump', 'une pompe'), sprinkler: t('the sprinkler', 'l’arroseur'),
  intakeInfo: t('The intake starts the harvest line: the produce falls on the belt by itself.', 'L’entrée commence la chaîne de récolte : les légumes tombent seuls sur le tapis.'),
  motorInfo: t('The motor supplies drive through its front.', 'Le moteur fournit la force par son avant.'),
  washerInfo: t('The washer sits on the line and needs Flow: without water, the line is incomplete.', 'La laveuse est sur la chaîne et a besoin d’eau : sans eau, la chaîne est incomplète.'),
  thresherInfo: t('The thresher needs drive from a motor beside it.', 'La batteuse a besoin de force d’un moteur à côté.'),
  graderInfo: t('The grader needs drive too, and hands the produce to the harvest bin.', 'La calibreuse a aussi besoin de force, et passe la récolte au bac.'),
  binInfo: t('The harvest bin ends the line. A farmhand assigned to it raises the yield of every Harvest.', 'Le bac de récolte termine la chaîne. Un ouvrier agricole qui lui est affecté augmente le rendement de chaque récolte.'),
  tankInfo: t('The tank holds the water. It gives nothing without a pump.', 'Le réservoir contient l’eau. Il ne donne rien sans pompe.'),
  pumpInfo: t('The pump needs drive: it pushes the tank’s water out of its front.', 'La pompe a besoin de force : elle pousse l’eau du réservoir par son avant.'),
  sprinklerInfo: t('The sprinkler takes water through its side. An irrigator assigned to it adds Field tiles to the Farm.', 'L’arroseur reçoit l’eau par son côté. Un irrigateur qui lui est affecté ajoute des parcelles à la ferme.'),
};

const INTROS: Record<GuidedLevel, LevelIntro> = {
  simple: {
    title: t('A first harvest line', 'Une première chaîne de récolte'), objective: t('Carry the harvest from the intake to the harvest bin.', 'Porter la récolte de l’entrée jusqu’au bac de récolte.'),
    explanation: t('The washer needs water, the thresher and the grader need drive, and a farmhand at the bin raises the yield of the Harvest.', 'La laveuse veut de l’eau, la batteuse et la calibreuse veulent de la force, et un ouvrier agricole au bac augmente le rendement de la récolte.'),
    summary: t('Build the harvest line and raise the yield of the Harvest.', 'Construire la chaîne de récolte et augmenter le rendement de la récolte.'),
  },
  intermediate: {
    title: t('Water the fields', 'Arroser les champs'), objective: t('Bring the water of a tank to a left-handed sprinkler.', 'Amener l’eau d’un réservoir à un arroseur gaucher.'),
    explanation: t('A pump driven by a motor pushes the tank’s water to the sprinkler, and an irrigator at the sprinkler adds Field tiles to the Farm.', 'Une pompe entraînée par un moteur pousse l’eau du réservoir jusqu’à l’arroseur, et un irrigateur à l’arroseur ajoute des parcelles à la ferme.'),
    summary: t('Irrigate to raise the Field cap of the Farm.', 'Irriguer pour augmenter le nombre de parcelles de la ferme.'),
  },
  advanced: {
    title: t('A washer without water', 'Une laveuse sans eau'), objective: t('Find why the harvest does not reach the bin and fix it.', 'Trouver pourquoi la récolte n’atteint pas le bac et le corriger.'),
    explanation: t('The pump motor will face away from the pump. You will inspect the line, then turn the motor.', 'Le moteur de la pompe sera tourné à l’opposé de la pompe. Tu vas inspecter la chaîne, puis tourner le moteur.'),
    summary: t('Diagnose a washer that gets no water.', 'Diagnostiquer une laveuse qui ne reçoit pas d’eau.'),
  },
};

interface Expectation {
  count: number;
  lined?: boolean;
  farmhand?: boolean;
  irrigator?: boolean;
  noFlow?: boolean;
  crop?: boolean;
}

const check = ({ count, lined = false, farmhand = false, irrigator = false, noFlow = false, crop = false }: Expectation): DemonstrationStep['check'] => state => {
  const farm = roomOf(state);
  const fixtures = farm.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} fixtures, got ${fixtures.length}`);
  const links = interiorLinksOf(fixtures);
  const bin = fixtures.find(fixture => fixture.type === 'farmHarvestBin');
  if (bin !== undefined && links.lined.has(bin.id) !== lined) throw new Error(`expected a connected bin: ${lined}`);
  const washer = fixtures.find(fixture => fixture.type.startsWith('farmWasher'));
  if (noFlow && (!washer || !links.problems.get(washer.id)?.includes('noFlow'))) throw new Error('expected washer noFlow');
  if ((assignedFixturesOf(farm.interior, 'farmhand').length === 1) !== farmhand) throw new Error(`expected assigned farmhand: ${farmhand}`);
  if ((assignedFixturesOf(farm.interior, 'irrigator').length === 1) !== irrigator) throw new Error(`expected assigned irrigator: ${irrigator}`);
  if (farmhand && interiorBonusOfBuilding(farm).yield <= 0) throw new Error('expected a yield bonus');
  if (bin !== undefined && ((bin.recipe as string | undefined) === CROP) !== crop) throw new Error(`expected a crop on the bin: ${crop}`);
  if (irrigator && farmFieldCapOf(farm) <= farmTier(farm).fieldCap) throw new Error('expected a Field cap bonus');
};

const staffSteps = (pieces: readonly FarmPiece[], role: 'farmhand' | 'irrigator', count: number): DemonstrationStep[] => {
  const farmhand = role === 'farmhand';
  const target = pieces.findIndex(piece => (farmhand ? piece.fixture === 'farmHarvestBin' : piece.fixture.startsWith('farmSprinkler'))) + 1;
  const piece = pieces[target - 1]!;
  const lined = pieces.some(item => item.fixture === 'farmHarvestBin');
  return [
    {
      id: 'hire', title: farmhand ? t('Hire a farmhand', 'Embaucher un ouvrier agricole') : t('Hire an irrigator', 'Embaucher un irrigateur'), objective: t('Provide a worker.', 'Recruter un employé.'),
      action: farmhand ? t('Hire a farmhand.', 'Embauche un ouvrier agricole.') : t('Hire an irrigator.', 'Embauche un irrigateur.'),
      explanation: farmhand ? t('The farmhand delivers the yield bonus of the harvest bins.', 'L’ouvrier agricole délivre le bonus de rendement des bacs de récolte.') : t('The irrigator delivers the Field cap bonus of the sprinklers.', 'L’irrigateur délivre le bonus de parcelles des arroseurs.'),
      result: t('The worker is available.', 'L’employé est disponible.'), commands: [{ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role }], check: check({ count, lined }),
    },
    {
      id: 'assign', title: farmhand ? t('Assign the farmhand', 'Affecter l’ouvrier agricole') : t('Assign the irrigator', 'Affecter l’irrigateur'), objective: t('Put the worker to work.', 'Mettre l’employé au travail.'),
      action: farmhand ? t('Assign the farmhand to the harvest bin.', 'Affecte l’ouvrier agricole au bac de récolte.') : t('Assign the irrigator to the sprinkler.', 'Affecte l’irrigateur à l’arroseur.'),
      explanation: farmhand ? t('A bin only counts once a farmhand stands at it.', 'Un bac ne compte que lorsqu’un ouvrier agricole s’y tient.') : t('A sprinkler only counts once an irrigator stands at it.', 'Un arroseur ne compte que lorsqu’un irrigateur s’y tient.'),
      result: farmhand ? t('Every Harvest now gives more.', 'Chaque récolte donne maintenant plus.') : t('The Farm can now hold more Fields.', 'La ferme peut maintenant porter plus de parcelles.'),
      commands: [{ type: 'AssignInteriorStaff', buildingId: BUILDING_ID, fixtureId: target }], highlight: [{ x: piece.x, y: piece.y }], check: check({ count, lined, farmhand: farmhand, irrigator: !farmhand }),
    },
    ...(farmhand ? [{
      id: 'crop', title: t('Choose wheat', 'Choisir le blé'), objective: t('Pick what the farmhand harvests.', 'Choisir ce que l’ouvrier agricole récolte.'), action: t('Pick wheat on the harvest bin.', 'Choisis le blé sur le bac de récolte.'),
      explanation: t('The farmhand harvests the ready wheat Fields of the whole city by himself, a few an hour. Play the demonstration to watch the Fields empty.', 'L’ouvrier agricole récolte seul les parcelles de blé prêtes de toute la ville, quelques-unes par heure. Lance la démonstration pour voir les parcelles se vider.'),
      result: t('The farmhand harvests wheat.', 'L’ouvrier agricole récolte le blé.'), commands: [{ type: 'SetInteriorFocus' as const, buildingId: BUILDING_ID, fixtureId: target, good: CROP as GoodId }], highlight: [{ x: piece.x, y: piece.y }],
      check: check({ count, lined, farmhand: true, crop: true }),
    }] : []),
  ];
};

export const farmScenario = (level: GuidedLevel, pieces: FarmPiece[], role: 'farmhand' | 'irrigator', faulty = false): Demonstration => {
  const steps: DemonstrationStep[] = [{
    id: 'goal', ...INTROS[level], action: t('The room you see is an empty Tier 1 Farm interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur de ferme de niveau 1, vide. Tu vas l’équiper pièce par pièce.'),
    result: t('The room is empty.', 'La salle est vide.'), check: check({ count: 0 }),
  }];
  for (const [index, item] of pieces.entries()) {
    const last = index === pieces.length - 1;
    const lined = !faulty && pieces.slice(0, index + 1).some(piece => piece.fixture === 'farmHarvestBin') && last;
    steps.push({
      id: item.id, title: placeTitle(pieces.map(piece => piece.label), index), objective: t('Build the circuit.', 'Construire le circuit.'),
      action: t(`Place ${item.label[0]} at the highlighted cell, facing ${FACING[item.rotation]![0]}.`, `Place ${item.label[1]} sur la case indiquée, son avant tourné vers ${FACING[item.rotation]![1]}.`),
      explanation: item.explanation, result: last && !faulty ? t('The circuit is complete.', 'Le circuit est complet.') : t('Continue building.', 'Continue à construire.'),
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: item.fixture, x: item.x, y: item.y, rotation: item.rotation }], highlight: [{ x: item.x, y: item.y }],
      check: check({ count: index + 1, lined, noFlow: faulty && last }),
    });
  }
  if (faulty) {
    const pump = pieces.findIndex(piece => piece.fixture === 'farmPumpLeft');
    const motor = pieces.findIndex(piece => piece.id === 'pump-motor');
    steps.push({
      id: 'fix-motor', title: t('Turn the pump motor', 'Tourner le moteur de la pompe'), objective: t('Restore the water.', 'Rétablir l’eau.'), action: t('Turn the motor toward the pump.', 'Tourne le moteur vers la pompe.'),
      explanation: t('The pump needs drive to push the water to the washer.', 'La pompe a besoin de force pour pousser l’eau jusqu’à la laveuse.'), result: t('The harvest bin is reached.', 'Le bac de récolte est atteint.'),
      commands: [{ type: 'MoveInteriorFixture', buildingId: BUILDING_ID, fixtureId: motor + 1, x: pieces[motor]!.x, y: pieces[motor]!.y, rotation: 0 }], highlight: [{ x: pieces[pump]!.x, y: pieces[pump]!.y }],
      check: check({ count: pieces.length, lined: true }),
    });
  }
  steps.push(...staffSteps(pieces, role, pieces.length));
  return {
    id: `farm-${level}`, buildingType: 'farm', buildingId: BUILDING_ID, level, title: levelTitle(t('Farm', 'Ferme'), level), objective: INTROS[level].summary,
    initial: () => ({ ...lineCity('farm', `guided-farm-${level}-v1`, 1), fields: Array.from({ length: 4 }, (_, index) => ({ x: 52 + index, y: 50, crop: { species: 'wheat' as const, plantedAt: 0 } })) }), steps,
  };
};
