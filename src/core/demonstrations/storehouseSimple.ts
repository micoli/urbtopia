import { interiorLinksOf, storageCapacity } from '../index';
import { BUILDING_ID, lineCity, placer, roomOf } from './lineInterior';
import type { Demonstration, DemonstrationStep } from './scenario';

const place = placer('storehouse');
export const checkStorehouse = (count: number, complete: boolean, stocked = false): DemonstrationStep['check'] => state => {
  const building = roomOf(state);
  const fixtures = building.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} fixtures, got ${fixtures.length}`);
  const rack = fixtures.find(fixture => fixture.type === 'storehouseRack');
  const lined = rack !== undefined && interiorLinksOf(fixtures).lined.has(rack.id);
  if (lined !== complete) throw new Error(`expected complete rack line: ${complete}`);
  if (stocked && storageCapacity(state).goods <= storageCapacity({ ...state, buildings: state.buildings.map(candidate => candidate.id === BUILDING_ID ? { ...candidate, interior: undefined } : candidate) }).goods) throw new Error('expected increased storage capacity');
};

export const storehouseSimple: Demonstration = {
  id: 'storehouse-simple', buildingType: 'storehouse', buildingId: BUILDING_ID, level: 'simple',
  title: ['Storehouse — Simple', 'Entrepôt — Simple'],
  objective: ['Increase storage capacity with a dock and a rack.', 'Augmenter la capacité de stockage avec un quai et un rayonnage.'],
  initial: () => lineCity('storehouse', 'guided-storehouse-simple-v1', 2),
  steps: [
    { id: 'goal', title: ['Make room for goods', 'Faire de la place pour les biens'], objective: ['Build a short storage line.', 'Construire une courte chaîne de stockage.'],
      action: ['The room you see is an empty Tier 2 Storehouse interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur d’entrepôt de niveau 2, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A driven dock feeds a rack. A stocker makes the completed line add storage capacity.', 'Un quai entraîné alimente un rayonnage. Un magasinier permet à la chaîne complète d’ajouter de la capacité de stockage.'],
      result: ['The room is empty and your own city is unchanged.', 'La salle est vide et ta propre ville reste inchangée.'], check: checkStorehouse(0, false) },
    { id: 'dock', title: ['Place the dock', 'Placer le quai'], objective: ['Start the storage line.', 'Commencer la chaîne de stockage.'],
      action: ['Place the dock against the back wall.', 'Place le quai contre le mur du fond.'], explanation: ['The dock sends goods forward and takes drive on its right.', 'Le quai envoie les biens vers l’avant et reçoit la force à droite.'],
      result: ['The dock has no drive yet.', 'Le quai n’est pas encore entraîné.'], commands: [place('Dock', 0, 0, 0)], highlight: [{ x: 0, y: 0 }], check: checkStorehouse(1, false) },
    { id: 'motor', title: ['Drive the dock', 'Entraîner le quai'], objective: ['Connect a motor.', 'Raccorder un moteur.'],
      action: ['Place a motor to the right of the dock, facing it.', 'Place un moteur à droite du quai, tourné vers lui.'], explanation: ['The motor supplies the dock’s drive input.', 'Le moteur alimente l’entrée de force du quai.'],
      result: ['The dock has drive but no rack.', 'Le quai reçoit la force mais n’a pas de rayonnage.'], commands: [place('Motor', 1, 0, 1)], highlight: [{ x: 1, y: 0 }], check: checkStorehouse(2, false) },
    { id: 'rack', title: ['Place the rack', 'Placer le rayonnage'], objective: ['Complete the line.', 'Compléter la chaîne.'],
      action: ['Place a rack in front of the dock, facing it.', 'Place un rayonnage devant le quai, tourné vers lui.'], explanation: ['The rack receives goods at its front and ends the line.', 'Le rayonnage reçoit les biens par son avant et termine la chaîne.'],
      result: ['The dock reaches the rack.', 'Le quai atteint le rayonnage.'], commands: [place('Rack', 0, 1, 2)], highlight: [{ x: 0, y: 1 }], check: checkStorehouse(3, true) },
    { id: 'stocker', title: ['Hire a stocker', 'Embaucher un magasinier'], objective: ['Use the added capacity.', 'Utiliser la capacité supplémentaire.'],
      action: ['Hire a stocker.', 'Embauche un magasinier.'], explanation: ['The stocker activates the capacity bonus from the completed line.', 'Le magasinier active le bonus de capacité de la chaîne complète.'],
      result: ['The storehouse holds more goods and materials.', 'L’entrepôt peut stocker plus de biens et de matériaux.'], commands: [{ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'stocker' }], check: checkStorehouse(3, true, true) },
  ],
};
