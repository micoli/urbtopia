import { BUILDING_ID, checkLine, lineCity, placer } from './lineInterior';
import type { Demonstration } from './scenario';

const place = placer('packhouse');
// Fixture ids follow the order of placement: Packer 1, Shaft 2, Motor 3, Conveyors 4 and 5, Conveyor elbow 6, Conveyor 7, Crate exit 8.
const LINE = [1, 4, 5, 6, 7, 8];

export const packhouseSimple: Demonstration = {
  id: 'packhouse-simple',
  buildingType: 'packhouse',
  buildingId: BUILDING_ID,
  level: 'simple',
  title: ['Packhouse — Simple', 'Atelier de conditionnement — Simple'],
  objective: ['Carry Packets from a Packer to an Exit, with straight Conveyors and an elbow.', 'Porter des colis d’une emballeuse à une sortie, avec des tapis droits et un coude.'],
  initial: () => lineCity('packhouse', 'guided-packhouse-simple-v1', 1),
  steps: [
    {
      id: 'goal',
      title: ['A Line from the Packer to an Exit', 'Une chaîne de l’emballeuse à une sortie'],
      objective: ['Know what a Line is made of.', 'Savoir de quoi une chaîne est faite.'],
      action: ['The room you see is an empty Tier 1 Packhouse interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur de conditionnement de niveau 1, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A Packer, driven by a Motor, makes the Packets. Conveyors carry them to an Exit set against an edge of the room, and only an Exit that the Line reaches counts. In your City, you need a Packhouse and enough Urbs for the pieces.', 'Une emballeuse, entraînée par un moteur, fabrique les colis. Des tapis les portent jusqu’à une sortie posée contre un bord de la salle, et seule une sortie atteinte par la chaîne compte. Dans ta ville, il faut un conditionnement et assez d’Urbs pour les pièces.'],
      result: ['The room is empty for now, and your City stays unchanged while you learn.', 'La salle est vide pour l’instant, et ta ville reste inchangée pendant la démonstration.'],
      check: checkLine({ count: 0 }),
    },
    {
      id: 'packer',
      title: ['Place the Packer and its Drive', 'Placer l’emballeuse et sa force'],
      objective: ['Start the Line with a driven Packer.', 'Commencer la chaîne par une emballeuse entraînée.'],
      action: ['Place the left-handed Packer against the back wall, a Shaft on its left, then a Motor facing the Shaft.', 'Place l’emballeuse gauchère contre le mur du fond, un arbre à sa gauche, puis un moteur tourné vers l’arbre.'],
      explanation: ['A Packer stands against the back wall only, and takes its Drive on one side: here the left. A Packer without Drive starts nothing.', 'Une emballeuse se pose contre le mur du fond uniquement, et prend sa force d’un seul côté : ici la gauche. Une emballeuse sans force ne démarre rien.'],
      result: ['The Packer runs, but its Packets have nowhere to go.', 'L’emballeuse fonctionne, mais ses colis n’ont nulle part où aller.'],
      commands: [place('PackerLeft', 2, 0, 0), place('Shaft', 1, 0, 1), place('Motor', 0, 0, 3)],
      highlight: [{ x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }],
      check: checkLine({ count: 3, linked: [1] }),
    },
    {
      id: 'conveyors',
      title: ['Lay straight Conveyors', 'Poser des tapis droits'],
      objective: ['Carry the Packets away from the Packer.', 'Éloigner les colis de l’emballeuse.'],
      action: ['Place two straight Conveyors under the Packer.', 'Place deux tapis droits sous l’emballeuse.'],
      explanation: ['A Conveyor carries the Packets from its back to its front, so each one must face the next.', 'Un tapis porte les colis de son dos à son avant : chacun doit donc être tourné vers le suivant.'],
      result: ['The Packets have a way, but it leads nowhere yet.', 'Les colis ont un chemin, mais il ne mène encore nulle part.'],
      commands: [place('Conveyor', 2, 1, 0), place('Conveyor', 2, 2, 0)],
      highlight: [{ x: 2, y: 1 }, { x: 2, y: 2 }],
      check: checkLine({ count: 5, linked: [1] }),
    },
    {
      id: 'elbow',
      title: ['Turn a corner with an elbow', 'Tourner à un coin avec un coude'],
      objective: ['Change the direction of the Line.', 'Changer la direction de la chaîne.'],
      action: ['Place an elbow Conveyor that turns to the left of the Packets, then a straight Conveyor after it.', 'Place un tapis coudé qui tourne à gauche des colis, puis un tapis droit après lui.'],
      explanation: ['An elbow takes the Packets in at its back and gives them to its side. The left and right elbows are not interchangeable: take the one that turns toward where you want to go.', 'Un coude prend les colis par son dos et les donne par son côté. Les coudes gauche et droit ne sont pas interchangeables : prends celui qui tourne vers l’endroit voulu.'],
      result: ['The Line now ends beside the left wall, still without an Exit.', 'La chaîne finit maintenant près du mur de gauche, toujours sans sortie.'],
      commands: [place('ConveyorElbowRight', 2, 3, 0), place('Conveyor', 1, 3, 1)],
      highlight: [{ x: 2, y: 3 }, { x: 1, y: 3 }],
      check: checkLine({ count: 7, linked: [1] }),
    },
    {
      id: 'exit',
      title: ['End the Line with an Exit', 'Terminer la chaîne par une sortie'],
      objective: ['Give the Packets a place to leave.', 'Donner aux colis un endroit où sortir.'],
      action: ['Place a Crate exit against the left wall, facing the last Conveyor.', 'Place une sortie caisse contre le mur de gauche, tournée vers le dernier tapis.'],
      explanation: ['An Exit stands against an edge of the room, with its back to the wall. It takes the Packets in at its front, and its size (Crate, Box or Pallet) decides which packed Goods gain speed and yield.', 'Une sortie se pose contre un bord de la salle, le dos au mur. Elle prend les colis par son avant, et sa taille (caisse, boîte ou palette) décide quels biens emballés gagnent en vitesse et en rendement.'],
      result: ['The Line is complete: the Packets travel from the Packer to the Exit.', 'La chaîne est complète : les colis vont de l’emballeuse à la sortie.'],
      commands: [place('ExitCrate', 0, 3, 3)],
      highlight: [{ x: 0, y: 3 }],
      check: checkLine({ count: 8, linked: [1], lined: LINE, paths: 1 }),
    },
  ],
};
