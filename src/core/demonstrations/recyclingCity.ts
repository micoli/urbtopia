import { recyclingGainsOf, interiorLinksOf } from '../factory/factoryInterior';
import type { FixtureId, Rotation } from '../engine/state';
import { BUILDING_ID, lineCity, roomOf } from './lineInterior';
import type { Demonstration, DemonstrationStep, DemonstrationText } from './scenario';

type Piece = { id: string; fixture: FixtureId; x: number; y: number; rotation: Rotation; label: DemonstrationText; description: DemonstrationText };
const en = (a: string, b: string): DemonstrationText => [a, b];
export const piece = (id: string, fixture: FixtureId, x: number, y: number, rotation: Rotation, label: DemonstrationText, description: DemonstrationText): Piece => ({ id, fixture, x, y, rotation, label, description });
export const checkRecycling = (count: number, complete: boolean): DemonstrationStep['check'] => state => {
  const building = roomOf(state);
  const fixtures = building.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} fixtures, got ${fixtures.length}`);
  if ((recyclingGainsOf(building).exits > 0) !== complete) throw new Error(`expected complete recycling line: ${complete}`);
};
export const recyclingScenario = (level: Demonstration['level'], pieces: Piece[], faulty = false, tier = 1): Demonstration => {
  const steps: DemonstrationStep[] = [{ id: 'goal', title: en('A recycling line', 'Une chaîne de recyclage'), objective: en('Connect the intake, sorter, recycler and exit.', 'Relier l’entrée, le trieur, la machine de recyclage et la sortie.'),
    action: en(`The room you see is an empty Tier ${tier} Recycling plant interior. You will fit it out piece by piece.`, `La salle que tu vois est un intérieur de centre de recyclage de niveau ${tier}, vide. Tu vas l’équiper pièce par pièce.`),
    explanation: en('The intake, sorter and recycler each need drive. A complete line increases recycling capacity and collection distance.', 'L’entrée, le trieur et la machine de recyclage ont chacun besoin de force. Une chaîne complète augmente la capacité de recyclage et la distance de collecte.'),
    result: en('The room is empty.', 'La salle est vide.'), check: checkRecycling(0, false) }];
  for (const [index, item] of pieces.entries()) {
    const last = index === pieces.length - 1;
    const connected = !faulty && pieces.slice(0, index + 1).some(piece => piece.fixture === 'recyclingPlantExit');
    steps.push({ id: item.id, title: en(`Place ${item.label[0]}`, `Placer ${item.label[1]}`), objective: en('Build the recycling line.', 'Construire la chaîne de recyclage.'),
      action: en(`Place ${item.label[0]} at the highlighted cell, facing ${['the front wall', 'left', 'the back wall', 'right'][item.rotation]}.`, `Place ${item.label[1]} sur la case indiquée, son avant tourné vers ${['le mur avant', 'la gauche', 'le mur du fond', 'la droite'][item.rotation]}.`), explanation: item.description,
      result: last && !faulty ? en('The recycling line is complete.', 'La chaîne de recyclage est complète.') : en('Continue building the line.', 'Continue à construire la chaîne.'),
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: item.fixture, x: item.x, y: item.y, rotation: item.rotation }], highlight: [{ x: item.x, y: item.y }],
      check: last && faulty ? state => { checkRecycling(pieces.length, false)(state); const fixtures = roomOf(state).interior!.fixtures; const sorter = fixtures.find(fixture => fixture.type.includes('Sorter'))!; if (!interiorLinksOf(fixtures).problems.get(sorter.id)?.includes('noDrive')) throw new Error('expected sorter noDrive'); } : checkRecycling(index + 1, connected),
    });
  }
  if (faulty) steps.push({ id: 'fix-motor', title: en('Turn the sorter motor', 'Tourner le moteur du trieur'), objective: en('Restore drive to the sorter.', 'Rétablir la force du trieur.'), action: en('Turn the sorter motor toward its input.', 'Tourne le moteur du trieur vers son entrée.'), explanation: en('The sorter must receive drive before the line can recycle.', 'Le trieur doit recevoir la force pour que la chaîne recycle.'), result: en('The recycling line is complete.', 'La chaîne de recyclage est complète.'),
    commands: [{ type: 'MoveInteriorFixture', buildingId: BUILDING_ID, fixtureId: 4, x: 2, y: 1, rotation: 1 }], highlight: [{ x: 2, y: 1 }],
    check: state => { checkRecycling(pieces.length, true)(state); const fixtures = roomOf(state).interior!.fixtures; const sorter = fixtures.find(fixture => fixture.type.includes('Sorter'))!; if (interiorLinksOf(fixtures).problems.has(sorter.id)) throw new Error('unexpected sorter problem'); },
  });
  return { id: `recyclingPlant-${level}`, buildingType: 'recyclingPlant', buildingId: BUILDING_ID, level, title: en(`Recycling plant — ${level}`, `Centre de recyclage — ${level === 'simple' ? 'Simple' : level === 'intermediate' ? 'Intermédiaire' : 'Avancé'}`), objective: en('Build a working recycling line.', 'Construire une chaîne de recyclage fonctionnelle.'), initial: () => lineCity('recyclingPlant', `guided-recycling-${level}-v1`, tier), steps };
};

export const labels = {
  intake: en('the intake', 'l’entrée'), sorter: en('the sorter', 'le trieur'), shredder: en('the shredder', 'le broyeur'), crusher: en('the crusher', 'le concasseur'), motor: en('a motor', 'un moteur'), conveyor: en('a conveyor', 'un tapis'), exit: en('the exit', 'la sortie'),
  intakeDescription: en('The intake starts the line and needs drive.', 'L’entrée commence la chaîne et a besoin de force.'), sorterDescription: en('The sorter must come before the recycler and needs drive.', 'Le trieur doit précéder la machine de recyclage et a besoin de force.'), recyclerDescription: en('The recycler processes the sorted material and needs drive.', 'La machine recycle les matières triées et a besoin de force.'), motorDescription: en('The motor supplies drive through its front.', 'Le moteur fournit la force par son avant.'), conveyorDescription: en('The conveyor carries material from its back to its front.', 'Le tapis transporte les matières de son dos vers son avant.'), exitDescription: en('The exit completes the route at the edge of the room.', 'La sortie termine le trajet au bord de la salle.'),
};
