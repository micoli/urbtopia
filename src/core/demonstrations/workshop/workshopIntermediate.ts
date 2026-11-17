import type { Demonstration } from '../scenario';
import { checkWorkshop, pick, place, WOOD, workshopCity, WORKSHOP_ID } from './workshopCity';

// Fixture ids follow the order of placement: Extractor 1, Cleaner 2, Storage bin 3, Tank 4, Pump 5, Elbow pipe 6, Tee pipe 7, Shafts 8 and 9, Motor 10.
const EXTRACTOR = 1;
const CLEANER = 2;
const BIN = 3;
const check = (expectation: Parameters<typeof checkWorkshop>[0]) => checkWorkshop(expectation, BIN);
const RUNNING = { count: 10, linked: [EXTRACTOR, CLEANER], lined: [EXTRACTOR, CLEANER, BIN] };

export const workshopIntermediate: Demonstration = {
  id: 'workshop-intermediate',
  buildingType: 'workshop',
  buildingId: WORKSHOP_ID,
  level: 'intermediate',
  title: ['Workshop — Intermediate', 'Atelier — Intermédiaire'],
  objective: ['Pass the material through a Cleaner and share one circuit of air between two Machines.', 'Faire passer le matériau par un nettoyeur et partager un circuit d’air entre deux machines.'],
  initial: () => workshopCity('guided-workshop-intermediate-v1', 1),
  steps: [
    {
      id: 'goal',
      title: ['Two Machines, one circuit of air', 'Deux machines, un seul circuit d’air'],
      objective: ['Know what each Machine of the Line needs.', 'Savoir ce dont chaque machine de la chaîne a besoin.'],
      action: ['The room you see is an empty Tier 1 Workshop interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur d’atelier de niveau 1, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['The Extractor and the Cleaner both run on pneumatic air. Pipes share the air of one Tank and one Pump between them. The Pump needs Drive from a Motor, which can stand far from it if Shafts carry the Drive along.', 'L’extracteur et le nettoyeur fonctionnent tous deux à l’air pneumatique. Des tuyaux partagent l’air d’un réservoir et d’une pompe entre eux. La pompe a besoin de la force d’un moteur, qui peut être loin d’elle si des arbres transportent la force.'],
      result: ['By the end, the material crosses the Cleaner before it reaches the bin.', 'À la fin, le matériau traverse le nettoyeur avant d’arriver au bac.'],
      check: check({ count: 0 }),
    },
    {
      id: 'line',
      title: ['Lay out the Line', 'Tracer la chaîne'],
      objective: ['Put the Cleaner between the Extractor and the bin.', 'Mettre le nettoyeur entre l’extracteur et le bac.'],
      action: ['Place the Extractor, then the Cleaner and the bin one under the other, with their air feeds on the right.', 'Place l’extracteur, puis le nettoyeur et le bac l’un sous l’autre, leurs alimentations pneumatiques à droite.'],
      explanation: ['A Line carries the item from the front of a Fixture to the back of the next. The Cleaner takes it in at its back and gives it at its front.', 'Une chaîne porte l’article de l’avant d’une pièce au dos de la suivante. Le nettoyeur le prend par son dos et le rend par son avant.'],
      result: ['The Line is laid out, but no Machine has air.', 'La chaîne est tracée, mais aucune machine n’a d’air.'],
      commands: [place('workshopExtractorRight', 0, 0, 0), place('workshopCleanerRight', 0, 1, 0), place('workshopBin', 0, 2, 0)],
      highlight: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
      check: check({ count: 3 }),
    },
    {
      id: 'source',
      title: ['Place the Tank and the Pump', 'Placer le réservoir et la pompe'],
      objective: ['Build the source of air.', 'Construire la source d’air.'],
      action: ['Place the Pump at the foot of the Line, facing up, and the Tank behind it.', 'Place la pompe au pied de la chaîne, tournée vers le haut, et le réservoir derrière elle.'],
      explanation: ['The Pump takes the air from its back, where the Tank stands, and pushes it out of its front. Its Drive input is on the left.', 'La pompe prend l’air par son dos, où se trouve le réservoir, et le pousse par son avant. Son entrée de force est à gauche.'],
      result: ['The air has a source, but nowhere to go yet.', 'L’air a une source, mais nulle part où aller.'],
      commands: [place('workshopTank', 1, 3, 2), place('workshopPumpLeft', 1, 2, 2)],
      highlight: [{ x: 1, y: 3 }, { x: 1, y: 2 }],
      check: check({ count: 5 }),
    },
    {
      id: 'pipes',
      title: ['Share the air with Pipes', 'Partager l’air avec des tuyaux'],
      objective: ['Bring the air to both Machines.', 'Amener l’air aux deux machines.'],
      action: ['Place a three-way Pipe above the Pump, opening toward the Cleaner, and an elbow Pipe above it, opening toward the Extractor.', 'Place un tuyau en T au-dessus de la pompe, ouvert vers le nettoyeur, et un tuyau coudé au-dessus de lui, ouvert vers l’extracteur.'],
      explanation: ['The three-way Pipe splits the air between the Cleaner and the rest of the column. The elbow turns it toward the Extractor.', 'Le tuyau en T répartit l’air entre le nettoyeur et le reste de la colonne. Le coude le tourne vers l’extracteur.'],
      result: ['The air path reaches both Machines, but the Pump is still stopped.', 'Le trajet de l’air atteint les deux machines, mais la pompe est toujours à l’arrêt.'],
      commands: [place('workshopPipeElbow', 1, 0, 1), place('workshopPipeTee', 1, 1, 1)],
      highlight: [{ x: 1, y: 0 }, { x: 1, y: 1 }],
      check: check({ count: 7 }),
    },
    {
      id: 'drive',
      title: ['Carry the Drive with Shafts', 'Transporter la force avec des arbres'],
      objective: ['Drive the Pump from a Motor that stands far from it.', 'Entraîner la pompe depuis un moteur éloigné.'],
      action: ['Place two Shafts to the right of the Pump, then the Motor at their end, facing them.', 'Place deux arbres à droite de la pompe, puis le moteur à leur bout, tourné vers eux.'],
      explanation: ['A Shaft carries Drive along its axis, from one end to the other. The Motor hands it to the Pump through the Shafts, and the Pump pushes the air to both Machines.', 'Un arbre transporte la force selon son axe, d’un bout à l’autre. Le moteur la donne à la pompe par les arbres, et la pompe pousse l’air vers les deux machines.'],
      result: ['The Extractor and the Cleaner run, and the Line is complete.', 'L’extracteur et le nettoyeur fonctionnent, et la chaîne est complète.'],
      commands: [place('workshopShaft', 2, 2, 1), place('workshopShaft', 3, 2, 1), place('workshopMotor', 4, 2, 1)],
      highlight: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }],
      check: check(RUNNING),
    },
    {
      id: 'pick',
      title: ['Pick the material', 'Choisir le matériau'],
      objective: ['See the item cross the Cleaner.', 'Voir l’article traverser le nettoyeur.'],
      action: ['Choose Wood on the Extractor.', 'Choisis le bois sur l’extracteur.'],
      explanation: ['The item leaves the Extractor, goes through the Cleaner and ends in the bin.', 'L’article sort de l’extracteur, traverse le nettoyeur et finit dans le bac.'],
      result: ['Wood reaches the bin.', 'Le bois arrive au bac.'],
      commands: [pick(EXTRACTOR, WOOD)],
      highlight: [{ x: 0, y: 0 }],
      check: check({ ...RUNNING, carried: WOOD }),
    },
    {
      id: 'restocker',
      title: ['Hire a restocker', 'Embaucher un employé de réassort'],
      objective: ['Let the queue run without you.', 'Laisser tourner la file sans toi.'],
      action: ['Hire a restocker and assign him to the bin.', 'Embauche un employé de réassort et affecte-le au bac.'],
      explanation: ['He restarts the production of the picked material every time it ends and stores it in the Storehouse. The Cleaner adds nothing to the yield: it only lengthens the Line.', 'Il relance la production du matériau choisi chaque fois qu’elle se termine et la range à l’entrepôt. Le nettoyeur n’ajoute rien au rendement : il ne fait qu’allonger la chaîne.'],
      result: ['The Workshop restocks itself.', 'L’atelier se réapprovisionne seul.'],
      commands: [{ type: 'HireInteriorStaff', buildingId: WORKSHOP_ID, role: 'restocker' }, { type: 'AssignInteriorStaff', buildingId: WORKSHOP_ID, fixtureId: BIN }],
      highlight: [{ x: 0, y: 2 }],
      check: check({ ...RUNNING, carried: WOOD, restocked: BIN }),
    },
  ],
};
