import { interiorLinksOf } from '../index';
import { BUILDING_ID, roomOf } from './lineInterior';
import { checkTextile, placeTextile, textileCity } from './textileCity';
import { textileMillSimple } from './textileMillSimple';
import type { Demonstration, DemonstrationStep } from './scenario';

const steps: DemonstrationStep[] = [];
for (const source of textileMillSimple.steps) {
  let step = source;
  if (step.id === 'goal') step = { ...step, title: ['Diagnose a disconnected drive', 'Diagnostiquer une force débranchée'], explanation: ['A motor and shaft must face the spinner. You will inspect a motor pointing away and then correct it.', 'Un moteur et un arbre doivent faire face à la filature. Tu vas observer un moteur mal orienté puis le corriger.'] };
  if (step.id === 'spinner') step = { ...step, commands: [placeTextile('textileSpinner', 3, 3, 1)], highlight: [{ x: 3, y: 3 }] };
  if (step.id === 'motor') {
    steps.push({ id: 'shaft', title: ['Place a shaft', 'Placer un arbre'], objective: ['Connect the future motor.', 'Relier le futur moteur.'], action: ['Place a shaft in front of the spinner.', 'Place un arbre devant la filature.'], explanation: ['The shaft carries drive from end to end.', 'L’arbre transporte la force d’une extrémité à l’autre.'], result: ['The shaft still needs a motor.', 'L’arbre a encore besoin d’un moteur.'], commands: [placeTextile('textileShaft', 2, 3, 1)], highlight: [{ x: 2, y: 3 }], check: checkTextile(2, false) });
    step = { ...step, title: ['Misface the motor', 'Mal orienter le moteur'], action: ['Place the motor facing away from the shaft.', 'Place le moteur tourné à l’opposé de l’arbre.'], explanation: ['The motor supplies drive only from its front.', 'Le moteur fournit la force uniquement par son avant.'], result: ['The spinner reports missing drive.', 'La filature signale l’absence de force.'], commands: [placeTextile('textileMotor', 1, 3, 0)], highlight: [{ x: 1, y: 3 }], check: state => { checkTextile(3, false)(state); if (!interiorLinksOf(roomOf(state).interior!.fixtures).problems.get(1)?.includes('noDrive')) throw new Error('expected noDrive'); } };
    steps.push(step);
    steps.push({ id: 'fix-motor', title: ['Turn the motor', 'Tourner le moteur'], objective: ['Restore drive.', 'Rétablir la force.'], action: ['Turn the motor toward the shaft.', 'Tourne le moteur vers l’arbre.'], explanation: ['The shaft now carries the motor’s drive to the spinner.', 'L’arbre transporte maintenant la force du moteur jusqu’à la filature.'], result: ['The spinner receives drive.', 'La filature reçoit la force.'], commands: [{ type: 'MoveInteriorFixture', buildingId: BUILDING_ID, fixtureId: 3, x: 1, y: 3, rotation: 3 }], highlight: [{ x: 1, y: 3 }], check: state => { checkTextile(3, true)(state); if (interiorLinksOf(roomOf(state).interior!.fixtures).problems.has(1)) throw new Error('unexpected spinner problem'); } });
    continue;
  }
  if (['recipe', 'hire', 'assign'].includes(step.id)) step = { ...step, highlight: step.highlight ? [{ x: 3, y: 3 }] : undefined, check: checkTextile(3, true, true, step.id === 'assign') };
  steps.push(step);
}
export const textileMillAdvanced: Demonstration = { ...textileMillSimple, id: 'textileMill-advanced', level: 'advanced', title: ['Textile mill — Advanced', 'Filature — Avancé'], objective: ['Find and fix a disconnected motor.', 'Trouver et corriger un moteur débranché.'], initial: () => textileCity('guided-textile-advanced-v1'), steps };
