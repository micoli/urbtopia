import { lineFaultOf } from '../factory/interiorLine';
import { interiorLinksOf } from '../factory/interiorLinks';
import type { FixtureId, Rotation } from '../engine/state';
import { BUILDING_ID, lineCity, roomOf } from './lineInterior';
import { levelTitle, placeTitle, type LevelIntro } from './guidedLevel';
import type { Demonstration, DemonstrationStep, DemonstrationText } from './scenario';

type Piece = { id: string; fixture: FixtureId; x: number; y: number; rotation: Rotation; label: DemonstrationText; explanation: DemonstrationText };
export const dairyPiece = (id: string, fixture: FixtureId, x: number, y: number, rotation: Rotation, label: DemonstrationText, explanation: DemonstrationText): Piece => ({ id, fixture, x, y, rotation, label, explanation });
const t = (en: string, fr: string): DemonstrationText => [en, fr];
const INTROS: Record<Demonstration['level'], LevelIntro> = {
  simple: { title: t('A first dairy line', 'Une première chaîne laitière'), objective: t('Connect the milk vat to a counter.', 'Relier la cuve à lait à un comptoir.'), explanation: t('A tank, a driven pump and the milk vat supply one line that ends at the counter.', 'Un réservoir, une pompe entraînée et la cuve à lait alimentent une seule chaîne qui finit au comptoir.'), summary: t('Build one dairy line from the vat to the counter.', 'Construire une chaîne laitière de la cuve au comptoir.') },
  intermediate: { title: t('One pasteuriser, two counters', 'Un pasteurisateur, deux comptoirs'), objective: t('Feed a pasteuriser with its own pump circuit and serve two counters.', 'Alimenter un pasteurisateur avec son propre circuit de pompe et servir deux comptoirs.'), explanation: t('The pasteuriser needs a separate pump circuit, and a splitter shares its products between two counters. A cream maker then unlocks the cream yield bonus.', 'Le pasteurisateur a besoin d’un circuit de pompe séparé, et un séparateur partage ses produits entre deux comptoirs. Un crémier débloque ensuite le bonus de rendement de la crème.'), summary: t('Build a dairy line with a pasteuriser that serves two counters.', 'Construire une chaîne laitière dont le pasteurisateur sert deux comptoirs.') },
  advanced: { title: t('A dairy line without milk flow', 'Une chaîne laitière sans fluide'), objective: t('Find why the counter gets no milk and fix it.', 'Trouver pourquoi le comptoir ne reçoit pas de lait et le corriger.'), explanation: t('The pump motor will be placed facing away from the pump. You will inspect the line without flow, then turn the motor.', 'Le moteur de la pompe sera placé à l’opposé de la pompe. Tu vas inspecter la chaîne sans fluide, puis tourner le moteur.'), summary: t('Diagnose and repair a dairy line without milk flow.', 'Diagnostiquer et réparer une chaîne laitière sans fluide.') },
};
export const dairyScenario = (level: Demonstration['level'], pieces: Piece[], tier: number, faulty = false): Demonstration => {
  const check = (count: number, complete: boolean, noFlow = false): DemonstrationStep['check'] => state => {
    const fixtures = roomOf(state).interior?.fixtures ?? [];
    if (fixtures.length !== count) throw new Error(`expected ${count} fixtures, got ${fixtures.length}`);
    const counter = fixtures.find(fixture => fixture.type === 'dairyCounter');
    const lined = counter !== undefined && interiorLinksOf(fixtures).lined.has(counter.id);
    if (lined !== complete) throw new Error(`expected complete dairy line: ${complete}`);
    if (noFlow && (!counter || lineFaultOf(fixtures, counter)?.kind !== 'noFlow')) throw new Error('expected noFlow fault');
  };
  const steps: DemonstrationStep[] = [{ id: 'goal', title: t('A dairy line', 'Une chaîne laitière'), objective: t('Connect the milk vat to a counter.', 'Relier la cuve à lait à un comptoir.'),
    action: t(`The room you see is an empty Tier ${tier} Dairy interior. You will fit it out piece by piece.`, `La salle que tu vois est un intérieur de laiterie de niveau ${tier}, vide. Tu vas l’équiper pièce par pièce.`),
    explanation: t('A tank, driven pump and milk vat supply the line. Machines downstream need their own flow.', 'Un réservoir, une pompe entraînée et une cuve à lait alimentent la chaîne. Les machines en aval ont besoin de leur propre fluide.'), result: t('The room is empty.', 'La salle est vide.'), check: check(0, false) }];
  steps[0] = { ...steps[0]!, title: INTROS[level].title, objective: INTROS[level].objective, explanation: INTROS[level].explanation };
  for (const [index, item] of pieces.entries()) {
    const last = index === pieces.length - 1;
    const connected = !faulty && pieces.slice(0, index + 1).some(piece => piece.fixture === 'dairyCounter');
    steps.push({ id: item.id, title: placeTitle(pieces.map(piece => piece.label), index), objective: t('Connect the dairy line.', 'Raccorder la chaîne laitière.'), action: t(`Place ${item.label[0]} at the highlighted cell, facing ${['the front wall', 'left', 'the back wall', 'right'][item.rotation]}.`, `Place ${item.label[1]} sur la case indiquée, son avant tourné vers ${['le mur avant', 'la gauche', 'le mur du fond', 'la droite'][item.rotation]}.`), explanation: item.explanation,
      result: last && !faulty ? t('The counter is reached.', 'Le comptoir est atteint.') : t('Continue building the line.', 'Continue à construire la chaîne.'),
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: item.fixture, x: item.x, y: item.y, rotation: item.rotation }], highlight: [{ x: item.x, y: item.y }], check: check(index + 1, connected, last && faulty) });
  }
  if (faulty) steps.push({ id: 'fix-motor', title: t('Turn the pump motor', 'Tourner le moteur de la pompe'), objective: t('Restore the milk flow.', 'Rétablir le fluide.'), action: t('Turn the motor toward the pump.', 'Tourne le moteur vers la pompe.'), explanation: t('The pump needs drive before it can supply the vat.', 'La pompe a besoin de force pour alimenter la cuve.'), result: t('The counter is reached.', 'Le comptoir est atteint.'), commands: [{ type: 'MoveInteriorFixture', buildingId: BUILDING_ID, fixtureId: 4, x: pieces[3]!.x, y: pieces[3]!.y, rotation: 2 }], highlight: [{ x: pieces[3]!.x, y: pieces[3]!.y }], check: check(pieces.length, true) });
  return { id: `dairy-${level}`, buildingType: 'dairy', buildingId: BUILDING_ID, level, title: levelTitle(t('Dairy', 'Laiterie'), level), objective: INTROS[level].summary, initial: () => lineCity('dairy', `guided-dairy-${level}-v1`, tier), steps };
};
export const dairyLabels = {
  vat: t('the milk vat', 'la cuve à lait'), pump: t('a pump', 'une pompe'), tank: t('a tank', 'un réservoir'), motor: t('a motor', 'un moteur'), counter: t('the counter', 'le comptoir'), conveyor: t('a conveyor', 'un tapis'), pasteurizer: t('the pasteuriser', 'le pasteurisateur'),
  vatInfo: t('The vat takes milk through its side and sends products forward.', 'La cuve reçoit le lait par son côté et envoie les produits vers l’avant.'), pumpInfo: t('The pump pushes flow when driven by a motor.', 'La pompe pousse le fluide lorsqu’un moteur l’entraîne.'), tankInfo: t('The tank supplies the pump through its front.', 'Le réservoir alimente la pompe par son avant.'), motorInfo: t('The motor must face the pump’s drive input.', 'Le moteur doit faire face à l’entrée de force de la pompe.'), counterInfo: t('The counter receives products at its front.', 'Le comptoir reçoit les produits par son avant.'), conveyorInfo: t('The conveyor carries products forward.', 'Le tapis transporte les produits vers l’avant.'), pasteurizerInfo: t('This pasteuriser takes milk on its right and needs a separate pump circuit.', 'Ce pasteurisateur reçoit le lait à droite et nécessite un circuit de pompe séparé.'),
};
