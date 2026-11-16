import { BUILDING_ID, lineCity, placer } from './lineInterior';
import { checkStorehouse } from './storehouseSimple';
import { linePathsOf } from '../factory/factoryInterior';
import { roomOf } from './lineInterior';
import type { Demonstration, DemonstrationStep, DemonstrationText } from './scenario';

const place = placer('storehouse');
const step = (id: string, title: DemonstrationText, action: DemonstrationText, explanation: DemonstrationText, command: NonNullable<DemonstrationStep['commands']>[number], x: number, y: number, count: number, complete = false): DemonstrationStep => ({
  id, title, objective: title, action, explanation,
  result: complete ? ['The rack is reached.', 'Le rayonnage est atteint.'] : ['Continue building the line.', 'Continue à construire la chaîne.'],
  commands: [command], highlight: [{ x, y }], check: checkStorehouse(count, complete),
});

export const storehouseIntermediate: Demonstration = {
  id: 'storehouse-intermediate', buildingType: 'storehouse', buildingId: BUILDING_ID, level: 'intermediate',
  title: ['Storehouse — Intermediate', 'Entrepôt — Intermédiaire'],
  objective: ['Add a powered hoist to a longer storage line.', 'Ajouter un palan entraîné à une chaîne de stockage plus longue.'],
  initial: () => lineCity('storehouse', 'guided-storehouse-intermediate-v1', 2),
  steps: [
    { id: 'goal', title: ['A line with a hoist', 'Une chaîne avec un palan'], objective: ['Connect a dock, a hoist and a rack.', 'Relier un quai, un palan et un rayonnage.'],
      action: ['The room you see is an empty Tier 2 Storehouse interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur d’entrepôt de niveau 2, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['The dock and hoist each need drive. Conveyors carry goods to the rack at the edge.', 'Le quai et le palan ont chacun besoin de force. Les tapis portent les biens jusqu’au rayonnage au bord de la salle.'],
      result: ['The room is empty.', 'La salle est vide.'], check: checkStorehouse(0, false) },
    step('dock', ['Place the dock', 'Placer le quai'], ['Place the dock against the back wall.', 'Place le quai contre le mur du fond.'], ['Its drive input is on its right.', 'Son entrée de force est à droite.'], place('Dock', 4, 0, 0), 4, 0, 1),
    step('dock-motor', ['Drive the dock', 'Entraîner le quai'], ['Place a motor facing the dock.', 'Place un moteur face au quai.'], ['The motor supplies the dock.', 'Le moteur alimente le quai.'], place('Motor', 5, 0, 1), 5, 0, 2),
    step('first-conveyor', ['Extend the line', 'Prolonger la chaîne'], ['Place a conveyor in front of the dock.', 'Place un tapis devant le quai.'], ['A conveyor carries goods forward.', 'Un tapis porte les biens vers l’avant.'], place('Conveyor', 4, 1, 0), 4, 1, 3),
    step('hoist', ['Place the hoist', 'Placer le palan'], ['Place the hoist after the conveyor.', 'Place le palan après le tapis.'], ['The hoist passes goods onward and needs its own drive.', 'Le palan transmet les biens et a besoin de sa propre force.'], place('Hoist', 4, 2, 0), 4, 2, 4),
    step('hoist-motor', ['Drive the hoist', 'Entraîner le palan'], ['Place a motor facing the hoist’s drive input.', 'Place un moteur face à l’entrée de force du palan.'], ['A motor on the right supplies the hoist.', 'Un moteur à droite alimente le palan.'], place('Motor', 5, 2, 1), 5, 2, 5),
    step('split', ['Split the line', 'Séparer la chaîne'], ['Place a splitter after the hoist.', 'Place un séparateur après le palan.'], ['It sends goods forward and to the right.', 'Il envoie les biens vers l’avant et vers la droite.'], place('ConveyorSplitStraightRight', 4, 3, 0), 4, 3, 6),
    step('elbow', ['Turn the side branch', 'Tourner la branche latérale'], ['Place an elbow on the right branch.', 'Place un coude sur la branche de droite.'], ['The elbow turns goods toward the room edge.', 'Le coude tourne les biens vers le bord de la salle.'], place('ConveyorElbowRight', 5, 3, 3), 5, 3, 7),
    step('conveyor-one', ['Extend the first branch', 'Prolonger la première branche'], ['Place the next conveyor.', 'Place le tapis suivant.'], ['The arrow faces the rack.', 'La flèche est tournée vers le rayonnage.'], place('Conveyor', 4, 4, 0), 4, 4, 8),
    step('conveyor-two', ['Extend the second branch', 'Prolonger la seconde branche'], ['Place another conveyor.', 'Place un autre tapis.'], ['This branch also reaches the edge.', 'Cette branche atteint également le bord.'], place('Conveyor', 5, 4, 0), 5, 4, 9),
    step('rack', ['Place a rack', 'Placer un rayonnage'], ['Place the first rack facing its conveyor.', 'Place le premier rayonnage face à son tapis.'], ['The first branch reaches a rack.', 'La première branche atteint un rayonnage.'], place('Rack', 4, 5, 2), 4, 5, 10, true),
    { ...step('second-rack', ['Place the second rack', 'Placer le second rayonnage'], ['Place the second rack facing its conveyor.', 'Place le second rayonnage face à son tapis.'], ['Both branches now end at a rack.', 'Les deux branches se terminent maintenant par un rayonnage.'], place('Rack', 5, 5, 2), 5, 5, 11, true), check: state => { checkStorehouse(11, true)(state); if (linePathsOf(roomOf(state).interior!.fixtures).length !== 2) throw new Error('expected two storage paths'); } },
    { id: 'stocker', title: ['Hire a stocker', 'Embaucher un magasinier'], objective: ['Activate the capacity bonus.', 'Activer le bonus de capacité.'],
      action: ['Hire a stocker.', 'Embauche un magasinier.'], explanation: ['The stocker makes the completed line add capacity.', 'Le magasinier permet à la chaîne complète d’ajouter de la capacité.'],
      result: ['The storehouse holds more.', 'L’entrepôt peut stocker davantage.'], commands: [{ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'stocker' }], check: checkStorehouse(11, true, true) },
  ],
};
