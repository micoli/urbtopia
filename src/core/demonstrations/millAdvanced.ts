import { BUILDING_ID } from './lineInterior';
import { checkMill, millSimple } from './millSimple';
import type { Demonstration, DemonstrationStep } from './scenario';

const steps: DemonstrationStep[] = [];
for (const step of millSimple.steps) {
  if (step.id === 'goal') {
    steps.push({ ...step, title: ['Diagnose an oil output', 'Diagnostiquer une sortie d’huile'],
      objective: ['Find and correct a misfacing output.', 'Trouver et corriger une sortie mal orientée.'],
      explanation: ['The millstone and pump need drive, and the oil tank must face the millstone. You will test a wrong orientation before correcting it.', 'La meule et la pompe ont besoin de force, et le réservoir d’huile doit faire face à la meule. Tu vas essayer une mauvaise orientation avant de la corriger.'],
      result: ['The room is empty and ready for the lesson.', 'La salle est vide et prête pour la leçon.'] });
  } else if (step.id === 'tank') {
    steps.push({ ...step, title: ['Turn the tank the wrong way', 'Orienter le réservoir dans le mauvais sens'],
      action: ['Place the oil tank beside the millstone, facing away from it.', 'Place le réservoir d’huile à côté de la meule, tourné dans la mauvaise direction.'],
      explanation: ['The tank must face the millstone to receive its output. This orientation will prevent the line from completing.', 'Le réservoir doit faire face à la meule pour recevoir sa sortie. Cette orientation empêchera la chaîne de se compléter.'],
      result: ['The tank is present but misfacing.', 'Le réservoir est présent mais mal orienté.'],
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: 'millOilTank', x: 3, y: 2, rotation: 2 }] });
  } else if (step.id === 'recipe') {
    steps.push({ ...step, result: ['The oil line is incomplete because the tank faces the wrong way.', 'La chaîne d’huile est incomplète car le réservoir est mal orienté.'], check: checkMill(6, true, false) });
    steps.push({ id: 'fix-tank', title: ['Turn the tank toward the millstone', 'Tourner le réservoir vers la meule'],
      objective: ['Correct the output connection.', 'Corriger le raccordement de la sortie.'],
      action: ['Rotate the oil tank to face the millstone.', 'Tourne le réservoir d’huile vers la meule.'],
      explanation: ['Facing the millstone connects the tank to its side output.', 'En faisant face à la meule, le réservoir se raccorde à sa sortie latérale.'],
      result: ['The oil line is complete.', 'La chaîne d’huile est complète.'],
      commands: [{ type: 'MoveInteriorFixture', buildingId: BUILDING_ID, fixtureId: 4, x: 3, y: 2, rotation: 1 }],
      highlight: [{ x: 3, y: 2 }], check: checkMill(6, true, true) });
  } else {
    steps.push(step.id === 'pump' ? { ...step, action: ['Place the pump next to the cleaner.', 'Place la pompe à côté de la nettoyeuse.'] } : step);
  }
}

export const millAdvanced: Demonstration = {
  ...millSimple, id: 'mill-advanced', level: 'advanced',
  title: ['Mill — Advanced', 'Moulin — Avancé'],
  objective: ['Diagnose and correct an oil tank facing the wrong way.', 'Diagnostiquer et corriger un réservoir d’huile mal orienté.'],
  steps: steps.map(step => ({ ...step,
    commands: step.commands?.map(command => command.type === 'PlaceInteriorFixture' || command.type === 'MoveInteriorFixture'
      ? { ...command, x: command.y, y: 4 - command.x, rotation: ((command.rotation ?? 0) + 3) % 4 as 0 | 1 | 2 | 3 }
      : command),
    highlight: step.highlight?.map(({ x, y }) => ({ x: y, y: 4 - x })),
  })),
};
