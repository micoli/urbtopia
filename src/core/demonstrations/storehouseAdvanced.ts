import { interiorLinksOf } from '../index';
import { BUILDING_ID, lineCity, roomOf } from './lineInterior';
import { checkStorehouse } from './storehouseSimple';
import { storehouseIntermediate } from './storehouseIntermediate';
import type { Demonstration, DemonstrationStep } from './scenario';

const steps: DemonstrationStep[] = [];
const checkHoist = (fault: boolean): DemonstrationStep['check'] => state => {
  checkStorehouse(8, !fault)(state);
  const problems = interiorLinksOf(roomOf(state).interior!.fixtures).problems.get(4) ?? [];
  if (problems.includes('noDrive') !== fault) throw new Error(`expected hoist noDrive: ${fault}`);
};
for (const original of storehouseIntermediate.steps) {
  if (original.id === 'elbow' || original.id === 'conveyor-two' || original.id === 'second-rack') continue;
  let step: DemonstrationStep = { ...original,
    commands: original.commands?.map(command => command.type === 'PlaceInteriorFixture' ? { ...command, x: command.x - 3 } : command),
    highlight: original.highlight?.map(({ x, y }) => ({ x: x - 3, y })),
  };
  if (step.id === 'split') step = { ...step, title: ['Extend the line', 'Prolonger la chaîne'], action: ['Place a conveyor after the hoist.', 'Place un tapis après le palan.'], explanation: ['The conveyor carries goods onward.', 'Le tapis transporte les biens plus loin.'], commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: 'storehouseConveyor', x: 1, y: 3, rotation: 0 }], check: checkStorehouse(6, false) };
  if (step.id === 'conveyor-one') step = { ...step, check: checkStorehouse(7, false) };
  if (step.id === 'stocker') step = { ...step, check: checkStorehouse(8, true, true) };
  if (step.id === 'goal') step = { ...step, title: ['Diagnose a stopped hoist', 'Diagnostiquer un palan arrêté'],
    objective: ['Find and fix a motor facing the wrong way.', 'Trouver et corriger un moteur mal orienté.'],
    explanation: ['The dock and hoist need drive. You will deliberately turn the hoist motor away, inspect the incomplete line, and correct it.', 'Le quai et le palan ont besoin de force. Tu vas volontairement détourner le moteur du palan, observer la chaîne incomplète, puis le corriger.'] };
  if (step.id === 'hoist-motor') step = { ...step,
    title: ['Misface the motor', 'Mal orienter le moteur'],
    action: ['Place the motor beside the hoist facing away from its drive input.', 'Place le moteur à côté du palan, tourné à l’opposé de son entrée de force.'],
    explanation: ['A motor only delivers drive through its front.', 'Un moteur ne fournit la force que par son avant.'],
    commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: 'storehouseMotor', x: 2, y: 2, rotation: 0 }] };
  if (step.id === 'rack') step = { ...step,
    result: ['The rack is not reached because the hoist has no drive.', 'Le rayonnage n’est pas atteint car le palan ne reçoit pas de force.'],
    check: checkHoist(true) };
  steps.push(step);
  if (step.id === 'rack') steps.push({ id: 'fix-motor', title: ['Turn the motor toward the hoist', 'Tourner le moteur vers le palan'],
    objective: ['Restore drive to the hoist.', 'Rétablir la force du palan.'],
    action: ['Rotate the hoist motor toward its drive input.', 'Tourne le moteur vers l’entrée de force du palan.'],
    explanation: ['The hoist can now pass goods along the line.', 'Le palan peut maintenant transmettre les biens sur la chaîne.'],
    result: ['The rack is reached.', 'Le rayonnage est atteint.'],
    commands: [{ type: 'MoveInteriorFixture', buildingId: BUILDING_ID, fixtureId: 5, x: 2, y: 2, rotation: 1 }],
    highlight: [{ x: 2, y: 2 }], check: checkHoist(false) });
}

export const storehouseAdvanced: Demonstration = {
  ...storehouseIntermediate, id: 'storehouse-advanced', level: 'advanced',
  title: ['Storehouse — Advanced', 'Entrepôt — Avancé'],
  objective: ['Diagnose and fix a hoist without drive.', 'Diagnostiquer et corriger un palan sans force.'],
  initial: () => lineCity('storehouse', 'guided-storehouse-advanced-v1', 2), steps,
};
