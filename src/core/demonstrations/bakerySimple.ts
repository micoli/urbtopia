import { assign, BUILDING_ID, checkLine, focus, hire, lineCity, placer } from './lineInterior';
import type { Demonstration } from './scenario';

const place = placer('bakery');
// Fixture ids follow the order of placement: Mixer 1, Shaft 2, Motor 3, Conveyor 4, Oven 5, Tank 6, Pump 7, Motor 8, Conveyor 9, Display counter 10.
const MIXER = 1;
const OVEN = 5;
const COUNTER = 10;
const LINE = [MIXER, 4, OVEN, 9, COUNTER];
const RUNNING = { count: 10, linked: [MIXER, OVEN], lined: LINE, paths: 1 };

export const bakerySimple: Demonstration = {
  id: 'bakery-simple',
  buildingType: 'bakery',
  buildingId: BUILDING_ID,
  level: 'simple',
  title: ['Bakery — Simple', 'Boulangerie — Simple'],
  objective: ['Carry the dough from a Mixer through an Oven to a Display counter, with a baker and a seller.', 'Porter la pâte d’un pétrin à un comptoir vitrine en passant par un four, avec un boulanger et un vendeur.'],
  initial: () => lineCity('bakery', 'guided-bakery-simple-v1', 2),
  steps: [
    {
      id: 'goal',
      title: ['From dough to sales', 'De la pâte à la vente'],
      objective: ['Know the stages of a Bakery Line.', 'Connaître les étapes d’une chaîne de boulangerie.'],
      action: ['The room you see is an empty Tier 2 Bakery interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur de boulangerie de niveau 2, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A Mixer makes the dough and an Oven bakes it, on gas that a Tank and a Pump bring. A Display counter sells it. Mixers and Ovens add speed, Display counters add sales and yield. A baker bakes at the Oven and a seller sells at the counter, each on their own.', 'Un pétrin fait la pâte et un four la cuit, avec un gaz qu’un réservoir et une pompe amènent. Un comptoir vitrine la vend. Pétrins et fours ajoutent de la vitesse, les comptoirs vitrine des ventes et du rendement. Un boulanger cuit au four et un vendeur vend au comptoir, chacun seul.'],
      result: ['The room is empty for now, and your City stays unchanged while you learn.', 'La salle est vide pour l’instant, et ta ville reste inchangée pendant la démonstration.'],
      check: checkLine({ count: 0 }),
    },
    {
      id: 'mixer',
      title: ['Place the Mixer and its Drive', 'Placer le pétrin et sa force'],
      objective: ['Start the Line with a driven Mixer.', 'Commencer la chaîne par un pétrin entraîné.'],
      action: ['Place the Mixer against the back wall, a Shaft on its right, then a Motor facing the Shaft.', 'Place le pétrin contre le mur du fond, un arbre à sa droite, puis un moteur tourné vers l’arbre.'],
      explanation: ['A Mixer stands against the back wall only, and takes its Drive on one side: here the right.', 'Un pétrin se pose contre le mur du fond uniquement, et prend sa force d’un seul côté : ici la droite.'],
      result: ['The Mixer runs, but its dough has nowhere to go.', 'Le pétrin fonctionne, mais sa pâte n’a nulle part où aller.'],
      commands: [place('Mixer', 4, 0, 0), place('Shaft', 5, 0, 1), place('Motor', 6, 0, 1)],
      highlight: [{ x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }],
      check: checkLine({ count: 3, linked: [MIXER] }),
    },
    {
      id: 'oven',
      title: ['Place the Oven', 'Placer le four'],
      objective: ['Bake the dough.', 'Cuire la pâte.'],
      action: ['Place a Conveyor under the Mixer, then the Oven under the Conveyor.', 'Place un tapis sous le pétrin, puis le four sous le tapis.'],
      explanation: ['The Conveyor carries the dough from the Mixer to the back of the Oven. An Oven needs gas, which comes in on its left.', 'Le tapis porte la pâte du pétrin au dos du four. Un four a besoin de gaz, qui arrive par sa gauche.'],
      result: ['The Oven is in place but has no gas: it does not run.', 'Le four est en place mais n’a pas de gaz : il ne fonctionne pas.'],
      commands: [place('Conveyor', 4, 1, 0), place('Oven', 4, 2, 0)],
      highlight: [{ x: 4, y: 1 }, { x: 4, y: 2 }],
      check: checkLine({ count: 5, linked: [MIXER] }),
    },
    {
      id: 'gas',
      title: ['Bring the gas', 'Amener le gaz'],
      objective: ['Supply the Oven with gas.', 'Alimenter le four en gaz.'],
      action: ['Place the Tank, then the Pump against the Oven, and a Motor above the Pump.', 'Place le réservoir, puis la pompe contre le four, et un moteur au-dessus de la pompe.'],
      explanation: ['The Tank stores the gas. The Pump takes it from its back and pushes it out of its front, into the Oven, once a Motor drives it.', 'Le réservoir stocke le gaz. La pompe le prend par son dos et le pousse par son avant, dans le four, dès qu’un moteur l’entraîne.'],
      result: ['The Oven runs.', 'Le four fonctionne.'],
      commands: [place('Tank', 2, 2, 3), place('Pump', 3, 2, 3), place('Motor', 3, 1, 0)],
      highlight: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 1 }],
      check: checkLine({ count: 8, linked: [MIXER, OVEN] }),
    },
    {
      id: 'counter',
      title: ['Place the Display counter', 'Placer le comptoir vitrine'],
      objective: ['Give the bread a place to be sold.', 'Donner au pain un endroit où être vendu.'],
      action: ['Place a Conveyor under the Oven, then a Display counter facing it.', 'Place un tapis sous le four, puis un comptoir vitrine tourné vers lui.'],
      explanation: ['The counter ends the Line: it takes the bread in at its front. Unlike a Packhouse Exit, it stands anywhere in the room.', 'Le comptoir termine la chaîne : il prend le pain par son avant. À la différence d’une sortie de conditionnement, il se pose n’importe où dans la salle.'],
      result: ['The Line is complete from the Mixer to the counter.', 'La chaîne est complète, du pétrin au comptoir.'],
      commands: [place('Conveyor', 4, 3, 0), place('Counter', 4, 4, 2)],
      highlight: [{ x: 4, y: 3 }, { x: 4, y: 4 }],
      check: checkLine(RUNNING),
    },
    {
      id: 'baker',
      title: ['Choose a Recipe and hire a baker', 'Choisir une recette et embaucher un boulanger'],
      objective: ['Bake without you.', 'Cuire sans toi.'],
      action: ['Choose Bread on the Oven, hire a baker and assign him to the Oven.', 'Choisis le pain sur le four, embauche un boulanger et affecte-le au four.'],
      explanation: ['An Oven takes a baker only once it has a Recipe. He bakes and stores the Goods by himself, and adds speed to the Bakery.', 'Un four n’accepte un boulanger que lorsqu’il a une recette. Il cuit et range seul les biens, et ajoute de la vitesse à la boulangerie.'],
      result: ['The Oven bakes bread on its own.', 'Le four cuit du pain tout seul.'],
      commands: [focus(OVEN, 'bread'), hire('baker'), assign(OVEN)],
      highlight: [{ x: 4, y: 2 }],
      check: checkLine({ ...RUNNING, staffed: { baker: [OVEN] } }),
    },
    {
      id: 'seller',
      title: ['Hire a seller', 'Embaucher un vendeur'],
      objective: ['Sell without you.', 'Vendre sans toi.'],
      action: ['Choose Bread as the Sold Good of the counter, hire a seller and assign him to it.', 'Choisis le pain comme bien vendu du comptoir, embauche un vendeur et affecte-le au comptoir.'],
      explanation: ['A counter only offers what the Ovens upstream of it bake. The seller sells it by himself, which raises the Bakery’s sales.', 'Un comptoir ne propose que ce que cuisent les fours situés en amont. Le vendeur le vend seul, ce qui augmente les ventes de la boulangerie.'],
      result: ['The Bakery bakes and sells on its own.', 'La boulangerie cuit et vend toute seule.'],
      commands: [focus(COUNTER, 'bread'), hire('seller'), assign(COUNTER)],
      highlight: [{ x: 4, y: 4 }],
      check: checkLine({ ...RUNNING, staffed: { baker: [OVEN], seller: [COUNTER] } }),
    },
  ],
};
