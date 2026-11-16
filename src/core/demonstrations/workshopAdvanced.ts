import type { Demonstration } from './scenario';
import { checkWorkshop, pick, place, WOOD, workshopCity, WORKSHOP_ID } from './workshopCity';

// Fixture ids follow the order of placement: Extractor 1, Conveyor 2, Cleaner 3, backwards Conveyor 4, Storage bin 5, Tank 6, Pump 7, Elbow pipe 8, Pipe 9, Tee pipe 10, Motor 11.
const EXTRACTOR = 1;
const CLEANER = 3;
const BACKWARDS_CONVEYOR = 4;
const BIN = 5;
const check = (expectation: Parameters<typeof checkWorkshop>[0]) => checkWorkshop(expectation, BIN);
const RUNNING = { count: 11, linked: [EXTRACTOR, CLEANER], lined: [EXTRACTOR, 2, CLEANER, BACKWARDS_CONVEYOR, BIN] };

export const workshopAdvanced: Demonstration = {
  id: 'workshop-advanced',
  buildingType: 'workshop',
  buildingId: WORKSHOP_ID,
  level: 'advanced',
  title: ['Workshop — Advanced', 'Atelier — Avancé'],
  objective: ['Find why a Line stops although its Machines run.', 'Trouver pourquoi une chaîne s’arrête alors que ses machines fonctionnent.'],
  initial: () => workshopCity('guided-workshop-advanced-v1', 3),
  steps: [
    {
      id: 'goal',
      title: ['A Line that stops', 'Une chaîne qui s’arrête'],
      objective: ['Know where a Line can break.', 'Savoir où une chaîne peut se rompre.'],
      action: ['The room you see is an empty Tier 3 Workshop interior. Its floor is larger. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur d’atelier de niveau 3, vide. Son sol est plus grand. Tu vas l’équiper pièce par pièce.'],
      explanation: ['Machines can run while the Line between them is broken: a Conveyor that carries the wrong way hands nothing on. The game shows where the Line stops, and turning the Conveyor mends it.', 'Les machines peuvent fonctionner alors que la chaîne qui les relie est rompue : un tapis qui porte dans le mauvais sens ne transmet rien. Le jeu montre où la chaîne s’arrête, et tourner le tapis la répare.'],
      result: ['You will build a long Line with one Conveyor turned the wrong way, diagnose it and mend it.', 'Tu vas construire une longue chaîne dont un tapis est mal tourné, le diagnostiquer et le réparer.'],
      check: check({ count: 0 }),
    },
    {
      id: 'line',
      title: ['Lay out a long Line', 'Tracer une longue chaîne'],
      objective: ['Link the Machines with Conveyors.', 'Relier les machines par des tapis.'],
      action: ['Place the Extractor, a Conveyor, the Cleaner, a second Conveyor turned toward the Cleaner by mistake, and the bin.', 'Place l’extracteur, un tapis, le nettoyeur, un second tapis tourné par erreur vers le nettoyeur, et le bac.'],
      explanation: ['A Conveyor carries from its back to its front. The second one has its front toward the Cleaner, so the Cleaner and the Conveyor face each other and nothing passes.', 'Un tapis porte de son dos à son avant. Le second a son avant tourné vers le nettoyeur : le nettoyeur et le tapis se font face et rien ne passe.'],
      result: ['The Line is laid out with a mistake in it.', 'La chaîne est tracée, avec une erreur dedans.'],
      commands: [place('workshopExtractorRight', 0, 0, 0), place('workshopConveyor', 0, 1, 0), place('workshopCleanerRight', 0, 2, 0), place('workshopConveyor', 0, 3, 2), place('workshopBin', 0, 4, 0)],
      highlight: [{ x: 0, y: 3 }],
      check: check({ count: 5 }),
    },
    {
      id: 'air',
      title: ['Build the circuit of air', 'Construire le circuit d’air'],
      objective: ['Bring air to the Extractor and the Cleaner.', 'Amener l’air à l’extracteur et au nettoyeur.'],
      action: ['Place the Tank, the Pump above it, then an elbow Pipe, a straight Pipe and a three-way Pipe along the Line.', 'Place le réservoir, la pompe au-dessus, puis un tuyau coudé, un tuyau droit et un tuyau en T le long de la chaîne.'],
      explanation: ['The Pump pushes the air up the column. The three-way Pipe opens toward the Cleaner, and the elbow turns the rest toward the Extractor.', 'La pompe pousse l’air le long de la colonne. Le tuyau en T s’ouvre vers le nettoyeur, et le coude tourne le reste vers l’extracteur.'],
      result: ['The air reaches both Machines, but the Pump has no Drive.', 'L’air atteint les deux machines, mais la pompe n’a pas de force.'],
      commands: [place('workshopTank', 1, 4, 2), place('workshopPumpLeft', 1, 3, 2), place('workshopPipeElbow', 1, 0, 1), place('workshopPipe', 1, 1, 0), place('workshopPipeTee', 1, 2, 1)],
      highlight: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }],
      check: check({ count: 10 }),
    },
    {
      id: 'motor',
      title: ['Diagnose the stopped Line', 'Diagnostiquer la chaîne arrêtée'],
      objective: ['Tell a missing supply from a broken Line.', 'Distinguer une alimentation manquante d’une chaîne rompue.'],
      action: ['Place the Motor beside the Pump, then look at where the Line stops.', 'Place le moteur à côté de la pompe, puis regarde où la chaîne s’arrête.'],
      explanation: ['Both Machines are supplied now: the Extractor and the Cleaner run. Yet the bin gets nothing, and the game points at the Conveyor that faces the wrong way, not at the Machines.', 'Les deux machines sont alimentées : l’extracteur et le nettoyeur fonctionnent. Pourtant le bac ne reçoit rien, et le jeu désigne le tapis mal tourné, pas les machines.'],
      result: ['The Machines run, but no Line reaches the bin: the Conveyor is misfacing.', 'Les machines fonctionnent, mais aucune chaîne n’atteint le bac : le tapis est mal orienté.'],
      commands: [place('workshopMotor', 2, 3, 1)],
      highlight: [{ x: 0, y: 3 }],
      check: check({ count: 11, linked: [EXTRACTOR, CLEANER], fault: 'misfacing' }),
    },
    {
      id: 'fix',
      title: ['Turn the Conveyor', 'Tourner le tapis'],
      objective: ['Mend the Line.', 'Réparer la chaîne.'],
      action: ['Turn the Conveyor so that its front faces the bin.', 'Tourne le tapis pour que son avant regarde le bac.'],
      explanation: ['Nothing was missing: the Conveyor only had to carry toward the bin. The Line now runs from the Extractor to the bin.', 'Il ne manquait rien : le tapis devait seulement porter vers le bac. La chaîne va désormais de l’extracteur au bac.'],
      result: ['The Line is complete.', 'La chaîne est complète.'],
      commands: [{ type: 'MoveInteriorFixture', buildingId: WORKSHOP_ID, fixtureId: BACKWARDS_CONVEYOR, x: 0, y: 3, rotation: 0 }],
      highlight: [{ x: 0, y: 3 }],
      check: check(RUNNING),
    },
    {
      id: 'pick',
      title: ['Pick the material', 'Choisir le matériau'],
      objective: ['See the item travel the whole Line.', 'Voir l’article parcourir toute la chaîne.'],
      action: ['Choose Wood on the Extractor.', 'Choisis le bois sur l’extracteur.'],
      explanation: ['The item crosses both Conveyors and the Cleaner before it reaches the bin.', 'L’article traverse les deux tapis et le nettoyeur avant d’arriver au bac.'],
      result: ['Wood reaches the bin.', 'Le bois arrive au bac.'],
      commands: [pick(EXTRACTOR, WOOD)],
      highlight: [{ x: 0, y: 0 }],
      check: check({ ...RUNNING, carried: WOOD }),
    },
    {
      id: 'restocker',
      title: ['Hire a restocker', 'Embaucher un employé de réassort'],
      objective: ['Run the queue by itself.', 'Faire tourner la file seule.'],
      action: ['Hire a restocker and assign him to the bin.', 'Embauche un employé de réassort et affecte-le au bac.'],
      explanation: ['A restocker only works once an item reaches the bin, which is why the Line had to be mended first. A larger Workshop has more posts for restockers.', 'Un employé de réassort ne travaille que lorsqu’un article atteint le bac, c’est pourquoi il fallait d’abord réparer la chaîne. Un atelier plus grand offre plus de postes d’employés de réassort.'],
      result: ['The Workshop restocks itself.', 'L’atelier se réapprovisionne seul.'],
      commands: [{ type: 'HireInteriorStaff', buildingId: WORKSHOP_ID, role: 'restocker' }, { type: 'AssignInteriorStaff', buildingId: WORKSHOP_ID, fixtureId: BIN }],
      highlight: [{ x: 0, y: 4 }],
      check: check({ ...RUNNING, carried: WOOD, restocked: BIN }),
    },
  ],
};
