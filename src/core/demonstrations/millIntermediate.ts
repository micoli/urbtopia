import { BUILDING_ID } from './lineInterior';
import { checkMill, millSimple } from './millSimple';
import type { Demonstration, DemonstrationStep } from './scenario';
import type { GoodId } from '../index';

const steps: DemonstrationStep[] = millSimple.steps.map(step => {
  switch (step.id) {
    case 'goal': return { ...step, title: ['A flour line', 'Une chaîne de farine'],
      objective: ['Use a bagger as the flour output.', 'Utiliser une ensacheuse comme sortie de farine.'],
      explanation: ['The millstone needs a cleaner, a driven pump, a bagger and a miller to produce flour automatically.', 'La meule a besoin d’une nettoyeuse, d’une pompe entraînée, d’une ensacheuse et d’un meunier pour produire automatiquement de la farine.'] };
    case 'stone': return { ...step, objective: ['Choose the machine that grinds wheat.', 'Choisir la machine qui moud le blé.'],
      action: ['Place the right-output millstone.', 'Place la meule à sortie droite.'],
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: 'millstoneRight', x: 2, y: 2, rotation: 2 }] };
    case 'tank': return { ...step, title: ['Place the bagger', 'Placer l’ensacheuse'],
      objective: ['Provide a flour output.', 'Fournir une sortie pour la farine.'],
      action: ['Place the bagger facing the millstone’s right-hand output.', 'Place l’ensacheuse face à la sortie droite de la meule.'],
      explanation: ['The bagger receives the millstone’s side output.', 'L’ensacheuse reçoit la sortie latérale de la meule.'],
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: 'millBagger', x: 1, y: 2, rotation: 3 }] };
    case 'pump': return { ...step, action: ['Place the pump next to the cleaner.', 'Place la pompe à côté de la nettoyeuse.'] };
    case 'recipe': return { ...step, title: ['Select flour', 'Choisir la farine'],
      action: ['Select flour on the millstone.', 'Choisis la farine sur la meule.'],
      result: ['The flour line is complete.', 'La chaîne de farine est complète.'],
      commands: [{ type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId: 1, good: 'flour' as GoodId }], check: checkMill(6, true, true) };
    case 'assign': return { ...step,
      explanation: ['With wheat available and room in storage, the miller starts the selected recipe.', 'Avec du blé disponible et de la place en stockage, le meunier lance la recette choisie.'],
      result: ['The millstone is ready to produce flour.', 'La meule est prête à produire de la farine.'] };
    default: return step;
  }
});

export const millIntermediate: Demonstration = {
  ...millSimple, id: 'mill-intermediate', level: 'intermediate',
  title: ['Mill — Intermediate', 'Moulin — Intermédiaire'],
  objective: ['Produce flour with a cleaner, a pump and a bagger.', 'Produire de la farine avec une nettoyeuse, une pompe et une ensacheuse.'],
  initial: () => {
    const state = millSimple.initial();
    return { ...state, storage: { ...state.storage, materials: { ...state.storage.materials, wheat: 100 } } };
  },
  steps: steps.map(step => ({ ...step,
    commands: step.commands?.map(command => command.type === 'PlaceInteriorFixture'
      ? { ...command, x: 4 - command.y, y: command.x, rotation: ((command.rotation ?? 0) + 1) % 4 as 0 | 1 | 2 | 3 }
      : command),
    highlight: step.highlight?.map(({ x, y }) => ({ x: 4 - y, y: x })),
  })),
};
