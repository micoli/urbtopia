import { BUILDING_ID, checkLine, lineCity, placer } from './lineInterior';
import type { Demonstration } from './scenario';

const place = placer('packhouse');
// Fixture ids follow the order of placement: Packer 1, Shaft 2, Motor 3, Conveyor 4, Splitting Conveyor 5, left Conveyors 6 to 8, Crate exit 9, right Conveyors 10 and 11, Box exit 12.
const TRUNK = [1, 4, 5];
const LEFT = [6, 7, 8, 9];
const RIGHT = [10, 11, 12];

export const packhouseIntermediate: Demonstration = {
  id: 'packhouse-intermediate',
  buildingType: 'packhouse',
  buildingId: BUILDING_ID,
  level: 'intermediate',
  title: ['Packhouse — Intermediate', 'Atelier de conditionnement — Intermédiaire'],
  objective: ['Split one Line toward two Exits of different sizes.', 'Séparer une chaîne vers deux sorties de tailles différentes.'],
  initial: () => lineCity('packhouse', 'guided-packhouse-intermediate-v1', 3),
  steps: [
    {
      id: 'goal',
      title: ['One Packer, two Exits', 'Une emballeuse, deux sorties'],
      objective: ['Know why a Line is split.', 'Savoir pourquoi on sépare une chaîne.'],
      action: ['The room you see is an empty Tier 3 Packhouse interior. Its floor is larger. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur de conditionnement de niveau 3, vide. Son sol est plus grand. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A splitting Conveyor sends the Packets down two ways at once, so one Packer can serve a Crate exit and a Box exit. Each size of Exit that the Line reaches adds its bonus for the matching packed Goods. A Tier 3 Packhouse allows two Exits.', 'Un tapis répartiteur envoie les colis dans deux directions à la fois : une seule emballeuse peut ainsi servir une sortie caisse et une sortie boîte. Chaque taille de sortie atteinte par la chaîne ajoute son bonus aux biens emballés correspondants. Un conditionnement de niveau 3 permet deux sorties.'],
      result: ['By the end, one Packer feeds two Exits.', 'À la fin, une emballeuse alimente deux sorties.'],
      check: checkLine({ count: 0 }),
    },
    {
      id: 'packer',
      title: ['Start the Line', 'Démarrer la chaîne'],
      objective: ['Drive a Packer and carry its Packets down.', 'Entraîner une emballeuse et descendre ses colis.'],
      action: ['Place the Packer in the middle of the back wall, a Shaft and a Motor on its right, and a Conveyor under it.', 'Place l’emballeuse au milieu du mur du fond, un arbre et un moteur à sa droite, et un tapis sous elle.'],
      explanation: ['The Packer takes its Drive on its right here. The Conveyor carries the Packets toward the middle of the room.', 'L’emballeuse prend ici sa force à sa droite. Le tapis porte les colis vers le milieu de la salle.'],
      result: ['The Packer runs and the Packets leave it.', 'L’emballeuse fonctionne et les colis la quittent.'],
      commands: [place('Packer', 4, 0, 0), place('Shaft', 5, 0, 1), place('Motor', 6, 0, 1), place('Conveyor', 4, 1, 0)],
      highlight: [{ x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 4, y: 1 }],
      check: checkLine({ count: 4, linked: [1] }),
    },
    {
      id: 'split',
      title: ['Place the splitting Conveyor', 'Placer le tapis répartiteur'],
      objective: ['Make the Line branch.', 'Faire bifurquer la chaîne.'],
      action: ['Place a splitting Conveyor under the Conveyor.', 'Place un tapis répartiteur sous le tapis.'],
      explanation: ['It takes the Packets in at its back and gives them to both of its sides, left and right. Nothing leaves by its front.', 'Il prend les colis par son dos et les donne à ses deux côtés, gauche et droite. Rien ne sort par son avant.'],
      result: ['The Line forks, but neither branch leads to an Exit yet.', 'La chaîne bifurque, mais aucune branche ne mène encore à une sortie.'],
      commands: [place('ConveyorSplit', 4, 2, 0)],
      highlight: [{ x: 4, y: 2 }],
      check: checkLine({ count: 5, linked: [1] }),
    },
    {
      id: 'left',
      title: ['End the left branch', 'Terminer la branche de gauche'],
      objective: ['Bring the first branch to a Crate exit.', 'Amener la première branche à une sortie caisse.'],
      action: ['Place three Conveyors turned toward the left wall, then a Crate exit against it.', 'Place trois tapis tournés vers le mur de gauche, puis une sortie caisse contre lui.'],
      explanation: ['Each Conveyor of a branch faces the next one, as on any Line. The Exit takes the Packets in at its front.', 'Chaque tapis d’une branche est tourné vers le suivant, comme sur n’importe quelle chaîne. La sortie prend les colis par son avant.'],
      result: ['The left branch is complete: the Packets reach the Crate exit.', 'La branche de gauche est complète : les colis atteignent la sortie caisse.'],
      commands: [place('Conveyor', 3, 2, 1), place('Conveyor', 2, 2, 1), place('Conveyor', 1, 2, 1), place('ExitCrate', 0, 2, 3)],
      highlight: [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }],
      check: checkLine({ count: 9, linked: [1], lined: [...TRUNK, ...LEFT], paths: 1 }),
    },
    {
      id: 'right',
      title: ['End the right branch', 'Terminer la branche de droite'],
      objective: ['Bring the second branch to a Box exit.', 'Amener la seconde branche à une sortie boîte.'],
      action: ['Place two Conveyors turned toward the right wall, then a Box exit against it.', 'Place deux tapis tournés vers le mur de droite, puis une sortie boîte contre lui.'],
      explanation: ['The Packets now go down both ways at once. Both Exits are reached, so both sizes of packed Goods gain their bonus.', 'Les colis vont maintenant dans les deux directions à la fois. Les deux sorties sont atteintes : les deux tailles de biens emballés gagnent leur bonus.'],
      result: ['One Packer feeds a Crate exit and a Box exit.', 'Une emballeuse alimente une sortie caisse et une sortie boîte.'],
      commands: [place('Conveyor', 5, 2, 3), place('Conveyor', 6, 2, 3), place('ExitBox', 7, 2, 1)],
      highlight: [{ x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }],
      check: checkLine({ count: 12, linked: [1], lined: [...TRUNK, ...LEFT, ...RIGHT], paths: 2 }),
    },
  ],
};
