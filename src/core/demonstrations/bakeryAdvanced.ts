import { BUILDING_ID, checkLine, lineCity, placer, remove } from './lineInterior';
import type { Demonstration } from './scenario';

const place = placer('bakery');
// Fixture ids follow the order of placement: left-handed Mixer 1, Shaft 2, Motor 3, Conveyor 4, plain Conveyor 5, Oven 6, Pump 7, Tank 8, Motor 9, Conveyor 10, Display counter 11;
// second Mixer 12, Shaft 13, Motor 14, Conveyor 15, elbow 16, Conveyor 17; wrong joining Conveyor 18, right joining Conveyor 19.
const MIXER = 1;
const SECOND_MIXER = 12;
const OVEN = 6;
const PLAIN_CONVEYOR = 5;
const FIRST_LINE = [MIXER, 4, PLAIN_CONVEYOR, OVEN, 10, 11];
const SECOND_LINE = [SECOND_MIXER, 15, 16, 17];
const WRONG_JOINER = 18;
const RIGHT_JOINER = 19;

export const bakeryAdvanced: Demonstration = {
  id: 'bakery-advanced',
  buildingType: 'bakery',
  buildingId: BUILDING_ID,
  level: 'advanced',
  title: ['Bakery — Advanced', 'Boulangerie — Avancé'],
  objective: ['Join two Mixers into one Oven, from the right side.', 'Réunir deux pétrins vers un même four, du bon côté.'],
  initial: () => lineCity('bakery', 'guided-bakery-advanced-v1', 2),
  steps: [
    {
      id: 'goal',
      title: ['Two Mixers, one Oven', 'Deux pétrins, un four'],
      objective: ['Know what a joining Conveyor does.', 'Savoir ce que fait un tapis joigneur.'],
      action: ['The room you see is an empty Tier 2 Bakery interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur de boulangerie de niveau 2, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A straight Conveyor only takes dough in at its back. To bring a second Mixer into the Line, replace a Conveyor by a joining Conveyor, which also takes it in at one side. It is made for the left or for the right. An Oven can be fed by up to two Mixers.', 'Un tapis droit ne prend la pâte que par son dos. Pour amener un second pétrin dans la chaîne, remplace un tapis par un tapis joigneur, qui la prend aussi par un côté. Il est fait pour la gauche ou pour la droite. Un four peut être alimenté par deux pétrins au plus.'],
      result: ['You will build a Line, add a second Mixer that stays cut off, then join it.', 'Tu vas construire une chaîne, ajouter un second pétrin qui reste isolé, puis le réunir.'],
      check: checkLine({ count: 0 }),
    },
    {
      id: 'mixer',
      title: ['Place the first Mixer', 'Placer le premier pétrin'],
      objective: ['Start with a driven Mixer and a Conveyor.', 'Commencer par un pétrin entraîné et un tapis.'],
      action: ['Place the left-handed Mixer with its Shaft and Motor, a Conveyor under it and a straight Conveyor after.', 'Place le pétrin gaucher avec son arbre et son moteur, un tapis sous lui et un tapis droit ensuite.'],
      explanation: ['The Mixer takes its Drive on its left here.', 'Le pétrin prend ici sa force à sa gauche.'],
      result: ['The Mixer runs and its dough travels down.', 'Le pétrin fonctionne et sa pâte descend.'],
      commands: [place('MixerLeft', 2, 0, 0), place('Shaft', 1, 0, 1), place('Motor', 0, 0, 3), place('Conveyor', 2, 1, 0), place('Conveyor', 2, 2, 0)],
      highlight: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
      check: checkLine({ count: 5, linked: [MIXER] }),
    },
    {
      id: 'oven',
      title: ['Place the Oven and its gas', 'Placer le four et son gaz'],
      objective: ['Bake the dough.', 'Cuire la pâte.'],
      action: ['Place the Oven with its gas on the right, then the Pump, the Tank and the Motor that drives the Pump.', 'Place le four avec son gaz à droite, puis la pompe, le réservoir et le moteur qui entraîne la pompe.'],
      explanation: ['The right-hand Oven takes its gas on its right side. The Pump pushes it in from the Tank once a Motor drives it.', 'Le four à droite prend son gaz par son côté droit. La pompe le pousse depuis le réservoir dès qu’un moteur l’entraîne.'],
      result: ['The Oven runs.', 'Le four fonctionne.'],
      commands: [place('OvenRight', 2, 3, 0), place('Pump', 3, 3, 1), place('Tank', 4, 3, 1), place('Motor', 3, 4, 2)],
      highlight: [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 3, y: 4 }],
      check: checkLine({ count: 9, linked: [MIXER, OVEN] }),
    },
    {
      id: 'counter',
      title: ['End the Line at a counter', 'Terminer la chaîne à un comptoir'],
      objective: ['Complete the first Line.', 'Compléter la première chaîne.'],
      action: ['Place a Conveyor under the Oven, then a Display counter facing it.', 'Place un tapis sous le four, puis un comptoir vitrine tourné vers lui.'],
      explanation: ['Nothing new here: the bread goes straight from the Oven to the counter.', 'Rien de nouveau ici : le pain va tout droit du four au comptoir.'],
      result: ['The first Line runs.', 'La première chaîne fonctionne.'],
      commands: [place('Conveyor', 2, 4, 0), place('Counter', 2, 5, 2)],
      highlight: [{ x: 2, y: 4 }, { x: 2, y: 5 }],
      check: checkLine({ count: 11, linked: [MIXER, OVEN], lined: FIRST_LINE, paths: 1 }),
    },
    {
      id: 'second',
      title: ['Add a second Mixer beside it', 'Ajouter un second pétrin à côté'],
      objective: ['See why a straight Conveyor takes nothing from the side.', 'Voir pourquoi un tapis droit ne prend rien par le côté.'],
      action: ['Place a second Mixer with its Drive, a Conveyor, an elbow Conveyor and a last Conveyor facing the side of the first Line.', 'Place un second pétrin avec sa force, un tapis, un tapis coudé et un dernier tapis tourné vers le côté de la première chaîne.'],
      explanation: ['The second Mixer runs, but the straight Conveyor in front of its Line takes dough in at its back only. Its dough is cut off: nothing of it reaches the Oven.', 'Le second pétrin fonctionne, mais le tapis droit en face de sa chaîne ne prend la pâte que par son dos. Sa pâte est isolée : rien n’atteint le four.'],
      result: ['The second Mixer is linked, but its Line reaches nothing.', 'Le second pétrin est relié, mais sa chaîne n’atteint rien.'],
      commands: [place('Mixer', 4, 0, 0), place('Shaft', 5, 0, 1), place('Motor', 6, 0, 1), place('Conveyor', 4, 1, 0), place('ConveyorElbowRight', 4, 2, 0), place('Conveyor', 3, 2, 1)],
      highlight: [{ x: 3, y: 2 }, { x: 2, y: 2 }],
      check: checkLine({ count: 17, linked: [MIXER, OVEN, SECOND_MIXER], lined: FIRST_LINE, paths: 1 }),
    },
    {
      id: 'wrong-joiner',
      title: ['A joining Conveyor on the wrong side', 'Un tapis joigneur du mauvais côté'],
      objective: ['Recognise a joiner made for the other side.', 'Reconnaître un joigneur fait pour l’autre côté.'],
      action: ['Replace the straight Conveyor by a joining Conveyor that takes dough in on the left.', 'Remplace le tapis droit par un tapis joigneur qui prend la pâte à gauche.'],
      explanation: ['The second Line arrives from the right, and this joiner takes its second entry on the left: the side entry faces nothing.', 'La seconde chaîne arrive par la droite, et ce joigneur prend sa seconde entrée à gauche : l’entrée latérale ne fait face à rien.'],
      result: ['Still only the first Mixer reaches the Oven.', 'Seul le premier pétrin atteint toujours le four.'],
      commands: [remove(PLAIN_CONVEYOR), place('ConveyorJoinStraightLeft', 2, 2, 0)],
      highlight: [{ x: 2, y: 2 }],
      check: checkLine({ count: 17, linked: [MIXER, OVEN, SECOND_MIXER], lined: [...FIRST_LINE.filter(id => id !== PLAIN_CONVEYOR), WRONG_JOINER], paths: 1 }),
    },
    {
      id: 'right-joiner',
      title: ['Join with the right Conveyor', 'Joindre avec le bon tapis'],
      objective: ['Feed one Oven with both Mixers.', 'Alimenter un seul four avec les deux pétrins.'],
      action: ['Replace the joiner by the one that takes dough in on the right.', 'Remplace le joigneur par celui qui prend la pâte à droite.'],
      explanation: ['The side entry now faces the last Conveyor of the second Line. Both Mixers feed the same Oven, which is the most it accepts: a third Mixer would be too many.', 'L’entrée latérale fait désormais face au dernier tapis de la seconde chaîne. Les deux pétrins alimentent le même four, ce qui est le maximum qu’il accepte : un troisième serait de trop.'],
      result: ['Two Mixers feed one Oven.', 'Deux pétrins alimentent un four.'],
      commands: [remove(WRONG_JOINER), place('ConveyorJoinStraightRight', 2, 2, 0)],
      highlight: [{ x: 2, y: 2 }],
      check: checkLine({ count: 17, linked: [MIXER, OVEN, SECOND_MIXER], lined: [...FIRST_LINE.filter(id => id !== PLAIN_CONVEYOR), ...SECOND_LINE, RIGHT_JOINER], paths: 2 }),
    },
  ],
};
