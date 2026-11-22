import { engineRoomGainsOf, engineRoomReportOf } from '../../factory/engineRoomCircuits';
import type { BuildingType, FixtureId, Rotation } from '../../engine/state';
import { BUILDING_ID, lineCity, roomOf } from '../lineInterior';
import { levelTitle, placeTitle, type LevelIntro } from '../guidedLevel';
import type { Demonstration, DemonstrationStep, DemonstrationText, GuidedLevel } from '../scenario';

export type EnginePiece = { id: string; fixture: FixtureId; x: number; y: number; rotation: Rotation; label: DemonstrationText; description: DemonstrationText };

export const en = (a: string, b: string): DemonstrationText => [a, b];

export const piece = (id: string, fixture: FixtureId, x: number, y: number, rotation: Rotation, label: DemonstrationText, description: DemonstrationText): EnginePiece => ({ id, fixture, x, y, rotation, label, description });

const FACING = [en('the room', 'la salle'), en('the left', 'la gauche'), en('the back wall', 'le mur du fond'), en('the right', 'la droite')];

// A step is checked on the number of Fixtures placed and on the Circuits that count: none until the last link is laid.
export const checkEngineRoom = (count: number, circuits: number): DemonstrationStep['check'] => state => {
  const building = roomOf(state);
  const fixtures = building.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} Fixtures, got ${fixtures.length}`);
  const found = engineRoomReportOf(building).circuits.length;
  if (found !== circuits) throw new Error(`expected ${circuits} complete Circuits, got ${found}`);
};

interface EngineRoomScenarioOptions {
  type: BuildingType;
  name: DemonstrationText;
  level: GuidedLevel;
  intro: LevelIntro;
  circuitDescription: DemonstrationText;
  pieces: readonly EnginePiece[];
  // Advanced: the last piece placed is turned the wrong way, and a last step turns it back.
  faulty?: { fixtureId: number; x: number; y: number; rotation: Rotation; label: DemonstrationText };
}

export const engineRoomScenario = ({ type, name, level, intro, circuitDescription, pieces, faulty }: EngineRoomScenarioOptions): Demonstration => {
  const steps: DemonstrationStep[] = [{ id: 'goal', title: intro.title, objective: intro.objective,
    action: en('The room you see is an empty Tier 1 Engine room. You will fit it out piece by piece.', 'La salle que tu vois est une salle des machines de niveau 1, vide. Tu vas l’équiper pièce par pièce.'),
    explanation: intro.explanation, result: en('The room is empty.', 'La salle est vide.'), check: checkEngineRoom(0, 0) }];
  for (const [index, item] of pieces.entries()) {
    const last = index === pieces.length - 1;
    steps.push({ id: item.id, title: placeTitle(pieces.map(other => other.label), index), objective: circuitDescription,
      action: en(`Place ${item.label[0]} at the highlighted cell, its front toward ${FACING[item.rotation]![0]}.`, `Place ${item.label[1]} sur la case indiquée, son avant tourné vers ${FACING[item.rotation]![1]}.`), explanation: item.description,
      result: last && !faulty ? en('The Circuit is complete: the plant gains Capacity.', 'Le circuit est complet : la centrale gagne en capacité.') : en('Continue laying the Circuit.', 'Continue à poser le circuit.'),
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: item.fixture, x: item.x, y: item.y, rotation: item.rotation }], highlight: [{ x: item.x, y: item.y }],
      check: checkEngineRoom(index + 1, last && !faulty ? 1 : 0),
    });
  }
  if (faulty) steps.push({ id: 'fix-turn', title: en(`Turn ${faulty.label[0]}`, `Tourner ${faulty.label[1]}`), objective: en('Reconnect the Circuit.', 'Reconnecter le circuit.'),
    action: en(`Turn ${faulty.label[0]} so that it joins the two pipes.`, `Tourne ${faulty.label[1]} pour qu’il relie les deux tuyaux.`), explanation: en('A link only carries its Medium to the neighbour that faces it. A piece turned the wrong way cuts the Circuit, which then counts for nothing.', 'Un lien ne transmet son fluide qu’au voisin qui lui fait face. Une pièce mal tournée coupe le circuit, qui ne compte plus.'),
    result: en('The Circuit is complete: the plant gains Capacity.', 'Le circuit est complet : la centrale gagne en capacité.'),
    commands: [{ type: 'MoveInteriorFixture', buildingId: BUILDING_ID, fixtureId: faulty.fixtureId, x: faulty.x, y: faulty.y, rotation: faulty.rotation }], highlight: [{ x: faulty.x, y: faulty.y }],
    check: state => {
      checkEngineRoom(pieces.length, 1)(state);
      if (engineRoomGainsOf(roomOf(state)).generation <= 0) throw new Error('expected a gain of Capacity');
    },
  });
  return { id: `${type}-${level}`, buildingType: type, buildingId: BUILDING_ID, level, title: levelTitle(name, level), objective: intro.summary, initial: () => lineCity(type, `guided-${type}-${level}-v1`, 1), steps };
};
