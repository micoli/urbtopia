import { BUILDING_ID } from './lineInterior';
import { checkTextile, placeTextile, textileCity } from './textileCity';
import { textileMillSimple } from './textileMillSimple';
import type { Demonstration, DemonstrationStep } from './scenario';

const steps: DemonstrationStep[] = [];
for (const source of textileMillSimple.steps) {
  let step = source;
  if (step.id === 'goal') step = { ...step, title: ['Drive through a gear', 'Transmettre la force par un engrenage'], explanation: ['A gear carries drive through its axle to a right-output spinner.', 'Un engrenage transporte la force par son axe jusqu’à une filature à sortie droite.'] };
  if (step.id === 'spinner') step = { ...step, action: ['Place the right-output spinner.', 'Place la filature à sortie droite.'], commands: [placeTextile('textileSpinnerRight', 2, 2, 2)], highlight: [{ x: 2, y: 2 }] };
  if (step.id === 'motor') {
    steps.push({ id: 'gear', title: ['Place a gear', 'Placer un engrenage'], objective: ['Carry drive along the axle.', 'Transmettre la force par l’axe.'], action: ['Place a gear in front of the spinner.', 'Place un engrenage devant la filature.'], explanation: ['The axle connects the motor to the spinner.', 'L’axe relie le moteur à la filature.'], result: ['The gear still needs drive.', 'L’engrenage a encore besoin de force.'], commands: [placeTextile('textileGear', 2, 1, 1)], highlight: [{ x: 2, y: 1 }], check: checkTextile(2, false) });
    step = { ...step, action: ['Place the motor facing the gear.', 'Place le moteur face à l’engrenage.'], explanation: ['Drive passes through the gear’s axle to the spinner.', 'La force passe par l’axe de l’engrenage jusqu’à la filature.'], commands: [placeTextile('textileMotor', 2, 0, 0)], highlight: [{ x: 2, y: 0 }], check: checkTextile(3, true) };
  }
  if (['recipe', 'hire', 'assign'].includes(step.id)) step = { ...step, highlight: step.highlight ? [{ x: 2, y: 2 }] : undefined, check: checkTextile(3, true, true, step.id === 'assign') };
  steps.push(step);
}
export const textileMillIntermediate: Demonstration = { ...textileMillSimple, id: 'textileMill-intermediate', level: 'intermediate', title: ['Textile mill — Intermediate', 'Filature — Intermédiaire'], objective: ['Drive a spinner through a gear.', 'Entraîner une filature par un engrenage.'], initial: () => textileCity('guided-textile-intermediate-v1'), steps };
