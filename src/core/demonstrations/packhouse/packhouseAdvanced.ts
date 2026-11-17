import { BUILDING_ID, checkLine, lineCity, placer, remove } from '../lineInterior';
import type { Demonstration } from '../scenario';

const place = placer('packhouse');
// Fixture ids follow the order of placement: Packer 1, Shaft 2, Motor 3, Conveyors 4 to 8, Crate exit 9;
// second Packer 10, Shaft 11, Motor 12, Conveyor 13, elbow 14, Conveyor 15; wrong joining Conveyor 16, right joining Conveyor 17.
const FIRST_LINE = [1, 4, 5, 6, 7, 8, 9];
const SECOND_LINE = [10, 13, 14, 15];
const PLAIN_CONVEYOR = 5;
const WRONG_JOINER = 16;

export const packhouseAdvanced: Demonstration = {
  id: 'packhouse-advanced',
  buildingType: 'packhouse',
  buildingId: BUILDING_ID,
  level: 'advanced',
  title: ['Packhouse — Advanced', 'Atelier de conditionnement — Avancé'],
  objective: ['Join two Lines into one Exit, from the right side.', 'Réunir deux chaînes vers une seule sortie, du bon côté.'],
  initial: () => lineCity('packhouse', 'guided-packhouse-advanced-v1', 2),
  steps: [
    {
      id: 'goal',
      title: ['Two Lines, one Exit', 'Deux chaînes, une sortie'],
      objective: ['Know what a joining Conveyor does.', 'Savoir ce que fait un tapis joigneur.'],
      action: ['The room you see is an empty Tier 2 Packhouse interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur de conditionnement de niveau 2, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A straight Conveyor only takes Packets in at its back. To bring a second Line into the first one, replace a Conveyor by a joining Conveyor, which also takes them in at one side. It is made for the left or for the right: the wrong one leaves the second Line cut off.', 'Un tapis droit ne prend les colis que par son dos. Pour amener une seconde chaîne dans la première, remplace un tapis par un tapis joigneur, qui les prend aussi par un côté. Il est fait pour la gauche ou pour la droite : le mauvais laisse la seconde chaîne isolée.'],
      result: ['You will build two Lines, see the second one cut off, and join it.', 'Tu vas construire deux chaînes, voir la seconde isolée, puis la réunir.'],
      check: checkLine({ count: 0 }),
    },
    {
      id: 'first',
      title: ['Build a first complete Line', 'Construire une première chaîne complète'],
      objective: ['Start from a working Line.', 'Partir d’une chaîne qui fonctionne.'],
      action: ['Place a left-handed Packer with its Shaft and Motor, five straight Conveyors down the room and a Crate exit on the front edge.', 'Place une emballeuse gauchère avec son arbre et son moteur, cinq tapis droits le long de la salle et une sortie caisse sur le bord avant.'],
      explanation: ['Nothing new here: the Packets go straight from the Packer to the Exit.', 'Rien de nouveau ici : les colis vont tout droit de l’emballeuse à la sortie.'],
      result: ['The first Line runs.', 'La première chaîne fonctionne.'],
      commands: [place('PackerLeft', 2, 0, 0), place('Shaft', 1, 0, 1), place('Motor', 0, 0, 3), place('Conveyor', 2, 1, 0), place('Conveyor', 2, 2, 0), place('Conveyor', 2, 3, 0), place('Conveyor', 2, 4, 0), place('Conveyor', 2, 5, 0), place('ExitCrate', 2, 6, 2)],
      highlight: [{ x: 2, y: 0 }, { x: 2, y: 6 }],
      check: checkLine({ count: 9, linked: [1], lined: FIRST_LINE, paths: 1 }),
    },
    {
      id: 'second',
      title: ['Add a second Line beside it', 'Ajouter une seconde chaîne à côté'],
      objective: ['See why a straight Conveyor takes nothing from the side.', 'Voir pourquoi un tapis droit ne prend rien par le côté.'],
      action: ['Place a second Packer with its Drive, a Conveyor, an elbow Conveyor and a last Conveyor facing the side of the first Line.', 'Place une seconde emballeuse avec sa force, un tapis, un tapis coudé et un dernier tapis tourné vers le côté de la première chaîne.'],
      explanation: ['The second Packer runs and its Packets reach the end of its Line, but the straight Conveyor in front of it takes Packets in at its back only. The Line is cut off: nothing of it counts.', 'La seconde emballeuse fonctionne et ses colis arrivent au bout de sa chaîne, mais le tapis droit qui lui fait face ne prend les colis que par son dos. La chaîne est isolée : rien d’elle ne compte.'],
      result: ['The second Packer is linked, but its Line reaches no Exit.', 'La seconde emballeuse est reliée, mais sa chaîne n’atteint aucune sortie.'],
      commands: [place('Packer', 4, 0, 0), place('Shaft', 5, 0, 1), place('Motor', 6, 0, 1), place('Conveyor', 4, 1, 0), place('ConveyorElbowRight', 4, 2, 0), place('Conveyor', 3, 2, 1)],
      highlight: [{ x: 3, y: 2 }, { x: 2, y: 2 }],
      check: checkLine({ count: 15, linked: [1, 10], lined: FIRST_LINE, paths: 1 }),
    },
    {
      id: 'wrong-joiner',
      title: ['A joining Conveyor on the wrong side', 'Un tapis joigneur du mauvais côté'],
      objective: ['Recognise a joiner made for the other side.', 'Reconnaître un joigneur fait pour l’autre côté.'],
      action: ['Replace the straight Conveyor by a joining Conveyor that takes Packets in on the left.', 'Remplace le tapis droit par un tapis joigneur qui prend les colis à gauche.'],
      explanation: ['The second Line arrives from the right of the first one, and this joiner takes its second entry on the left. The side entry faces nothing: the second Line stays cut off.', 'La seconde chaîne arrive à droite de la première, et ce joigneur prend sa seconde entrée à gauche. L’entrée latérale ne fait face à rien : la seconde chaîne reste isolée.'],
      result: ['Still only the first Line reaches the Exit.', 'Seule la première chaîne atteint toujours la sortie.'],
      commands: [remove(PLAIN_CONVEYOR), place('ConveyorJoinStraightLeft', 2, 2, 0)],
      highlight: [{ x: 2, y: 2 }],
      check: checkLine({ count: 15, linked: [1, 10], lined: [...FIRST_LINE.filter(id => id !== PLAIN_CONVEYOR), WRONG_JOINER], paths: 1 }),
    },
    {
      id: 'right-joiner',
      title: ['Join with the right Conveyor', 'Joindre avec le bon tapis'],
      objective: ['Bring both Lines into the same Exit.', 'Amener les deux chaînes vers la même sortie.'],
      action: ['Replace the joiner by the one that takes Packets in on the right.', 'Remplace le joigneur par celui qui prend les colis à droite.'],
      explanation: ['Now the side entry faces the last Conveyor of the second Line. Both Lines merge and share the Crate exit.', 'L’entrée latérale fait désormais face au dernier tapis de la seconde chaîne. Les deux chaînes fusionnent et se partagent la sortie caisse.'],
      result: ['Both Packers feed the same Exit.', 'Les deux emballeuses alimentent la même sortie.'],
      commands: [remove(WRONG_JOINER), place('ConveyorJoinStraightRight', 2, 2, 0)],
      highlight: [{ x: 2, y: 2 }],
      check: checkLine({ count: 15, linked: [1, 10], lined: [...FIRST_LINE.filter(id => id !== PLAIN_CONVEYOR), ...SECOND_LINE, 17], paths: 2 }),
    },
  ],
};
