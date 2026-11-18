import { assign, BUILDING_ID, checkLine, focus, hire, lineCity, placer } from '../lineInterior';
import type { Demonstration } from '../scenario';

const place = placer('bakery');
// Fixture ids follow the order of placement: Mixer 1, Shaft 2, Motor 3, Tank 4, Pump 5, Motor 6, Conveyor 7, Oven 8,
// straight splitting Conveyor 9, front counter 10, side counter 11.
const MIXER = 1;
const OVEN = 8;
const FRONT = 10;
const SIDE = 11;
const TRUNK = [MIXER, 7, OVEN, 9];
const RUNNING = { count: 11, linked: [MIXER, OVEN], lined: [...TRUNK, FRONT, SIDE], paths: 2 };

export const bakeryIntermediate: Demonstration = {
  id: 'bakery-intermediate',
  buildingType: 'bakery',
  buildingId: BUILDING_ID,
  level: 'intermediate',
  title: ['Bakery — Intermediate', 'Boulangerie — Intermédiaire'],
  objective: ['Split the bread toward two Display counters and serve both with a seller each.', 'Séparer le pain vers deux comptoirs vitrine et servir chacun avec un vendeur.'],
  initial: () => lineCity('bakery', 'guided-bakery-intermediate-v1', 3),
  steps: [
    {
      id: 'goal',
      title: ['One Oven, two counters', 'Un four, deux comptoirs'],
      objective: ['Know why the Line is split.', 'Savoir pourquoi on sépare la chaîne.'],
      action: ['The room you see is an empty Tier 3 Bakery interior. Its floor is larger. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur de boulangerie de niveau 3, vide. Son sol est plus grand. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A splitting Conveyor sends the bread down two ways at once. Each Display counter on the Line adds sales and yield, and an Oven can serve up to three of them. A Tier 3 Bakery has posts for two sellers.', 'Un tapis répartiteur envoie le pain dans deux directions à la fois. Chaque comptoir vitrine de la chaîne ajoute des ventes et du rendement, et un four peut en servir jusqu’à trois. Une boulangerie de niveau 3 a deux postes de vendeurs.'],
      result: ['By the end, one Oven feeds two counters.', 'À la fin, un four alimente deux comptoirs.'],
      check: checkLine({ count: 0 }),
    },
    {
      id: 'production',
      title: ['Build the production', 'Construire la production'],
      objective: ['Get an Oven running.', 'Faire fonctionner un four.'],
      action: ['Place the Mixer and its Drive, the Tank, the Pump and its Motor, a Conveyor and the Oven.', 'Place le pétrin et sa force, le réservoir, la pompe et son moteur, un tapis et le four.'],
      explanation: ['This is the same production as in the simple demonstration: the Mixer’s dough goes through a Conveyor to the Oven, which bakes on gas pushed by a driven Pump.', 'C’est la même production que dans la démonstration simple : la pâte du pétrin passe par un tapis jusqu’au four, qui cuit avec du gaz poussé par une pompe entraînée.'],
      result: ['The Mixer and the Oven run, but nothing sells the bread yet.', 'Le pétrin et le four fonctionnent, mais rien ne vend encore le pain.'],
      commands: [place('Mixer', 4, 0, 0), place('Shaft', 5, 0, 1), place('Motor', 6, 0, 1), place('Tank', 2, 2, 3), place('Pump', 3, 2, 3), place('Motor', 3, 1, 0), place('Conveyor', 4, 1, 0), place('Oven', 4, 2, 0)],
      highlight: [{ x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }],
      check: checkLine({ count: 8, linked: [MIXER, OVEN] }),
    },
    {
      id: 'split',
      title: ['Place the straight splitting Conveyor', 'Placer le tapis répartiteur droit'],
      objective: ['Make the Line branch while it goes on.', 'Faire bifurquer la chaîne tout en la prolongeant.'],
      action: ['Place a straight splitting Conveyor under the Oven.', 'Place un tapis répartiteur droit sous le four.'],
      explanation: ['It takes the bread in at its back and gives it to its front and to its left. Choose the left-hand or the right-hand version to send the second way to the side you need.', 'Il prend le pain par son dos et le donne à son avant et à sa gauche. Choisis la version gauche ou droite pour envoyer la seconde voie du côté voulu.'],
      result: ['The Line forks, but neither way leads to a counter yet.', 'La chaîne bifurque, mais aucune voie ne mène encore à un comptoir.'],
      commands: [place('ConveyorSplitStraightLeft', 4, 3, 0)],
      highlight: [{ x: 4, y: 3 }],
      check: checkLine({ count: 9, linked: [MIXER, OVEN] }),
    },
    {
      id: 'front-counter',
      title: ['Place the first counter', 'Placer le premier comptoir'],
      objective: ['End the straight way.', 'Terminer la voie droite.'],
      action: ['Place a Display counter in front of the splitting Conveyor.', 'Place un comptoir vitrine devant le tapis répartiteur.'],
      explanation: ['The counter takes the bread in at its front, so it faces the Conveyor. The other way still leads nowhere.', 'Le comptoir prend le pain par son avant : il est donc tourné vers le tapis. L’autre voie ne mène toujours nulle part.'],
      result: ['The bread reaches the first counter.', 'Le pain atteint le premier comptoir.'],
      commands: [place('Counter', 4, 4, 2)],
      highlight: [{ x: 4, y: 4 }],
      check: checkLine({ count: 10, linked: [MIXER, OVEN], lined: [...TRUNK, FRONT], paths: 1 }),
    },
    {
      id: 'side-counter',
      title: ['Place the second counter', 'Placer le second comptoir'],
      objective: ['End the side way.', 'Terminer la voie latérale.'],
      action: ['Place a second Display counter on the left of the splitting Conveyor, facing it.', 'Place un second comptoir vitrine à gauche du tapis répartiteur, tourné vers lui.'],
      explanation: ['Both ways are now ended. The Oven feeds two counters, within the three it can serve.', 'Les deux voies sont maintenant terminées. Le four alimente deux comptoirs, dans la limite des trois qu’il peut servir.'],
      result: ['The bread reaches both counters.', 'Le pain atteint les deux comptoirs.'],
      commands: [place('Counter', 3, 3, 3)],
      highlight: [{ x: 3, y: 3 }],
      check: checkLine(RUNNING),
    },
    {
      id: 'baker',
      title: ['Choose a Recipe and hire a baker', 'Choisir une recette et embaucher un boulanger'],
      objective: ['Bake without you.', 'Cuire sans toi.'],
      action: ['Choose Bread on the Oven, hire a baker and assign him to the Oven.', 'Choisis le pain sur le four, embauche un boulanger et affecte-le au four.'],
      explanation: ['The counters can only offer what the Oven bakes, so the Recipe comes first.', 'Les comptoirs ne peuvent proposer que ce que cuit le four : la recette passe donc en premier.'],
      result: ['The Oven bakes bread on its own.', 'Le four cuit du pain tout seul.'],
      commands: [focus(OVEN, 'bread'), hire('baker'), assign(OVEN)],
      highlight: [{ x: 4, y: 2 }],
      check: checkLine({ ...RUNNING, staffed: { baker: [OVEN] } }),
    },
    {
      id: 'sellers',
      title: ['Hire a seller for each counter', 'Embaucher un vendeur par comptoir'],
      objective: ['Sell at both counters.', 'Vendre aux deux comptoirs.'],
      action: ['Choose Bread on both counters, hire two sellers and assign one to each.', 'Choisis le pain sur les deux comptoirs, embauche deux vendeurs et affecte-en un à chacun.'],
      explanation: ['Each seller works at one counter. A Tier 3 Bakery has posts for two of them.', 'Chaque vendeur travaille à un comptoir. Une boulangerie de niveau 3 a des postes pour deux d’entre eux.'],
      result: ['Both counters sell on their own.', 'Les deux comptoirs vendent seuls.'],
      commands: [focus(FRONT, 'bread'), focus(SIDE, 'bread'), hire('seller'), hire('seller'), assign(FRONT), assign(SIDE)],
      highlight: [{ x: 4, y: 4 }, { x: 3, y: 3 }],
      check: checkLine({ ...RUNNING, staffed: { baker: [OVEN], seller: [FRONT, SIDE] } }),
    },
  ],
};
