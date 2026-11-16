import { frontHasAccess } from '../map/placement';
import { unpoweredBuildingIds } from '../environment/powered';
import { interiorBonusOfBuilding, interiorLinksOf } from '../factory/factoryInterior';
import { factoryCity, FACTORY_ID } from './factoryCity';
import { demoFactory } from './factorySimple';
import type { Demonstration, DemonstrationStep } from './scenario';

// Fixture ids follow the order of placement: Motor 1, Shaft 2, Gear 3, counter-clockwise Lathe 4, Gear 5, clockwise Lathe 6.
const LATHE_CCW = 4;

const check = (count: number, linkedLathes: number, wrongTurn = false): DemonstrationStep['check'] => state => {
  const factory = demoFactory(state);
  if (!frontHasAccess(state, factory.type, factory.x, factory.y, factory.rotation, factory.tier)) throw new Error('demonstration Factory needs Road access');
  if (unpoweredBuildingIds(state).has(factory.id)) throw new Error('demonstration Factory needs electricity');
  const fixtures = factory.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} Fixtures, got ${fixtures.length}`);
  const links = interiorLinksOf(fixtures);
  const linked = fixtures.filter(fixture => fixture.type.startsWith('factoryLathe') && links.linked.has(fixture.id)).length;
  if (linked !== linkedLathes) throw new Error(`expected ${linkedLathes} linked Lathes, got ${linked}`);
  if (links.jammed) throw new Error('unexpected jammed Gears');
  if ((links.problems.get(LATHE_CCW)?.includes('wrongTurn') ?? false) !== wrongTurn) throw new Error(`expected wrong turn: ${wrongTurn}`);
};

const place = (fixture: 'factoryMotor' | 'factoryShaft' | 'factoryGear' | 'factoryLatheCw' | 'factoryLatheCcw', x: number, y: number, rotation: 0 | 1 | 2 | 3) =>
  ({ type: 'PlaceInteriorFixture' as const, buildingId: FACTORY_ID, fixture, x, y, rotation });

export const factoryIntermediate: Demonstration = {
  id: 'factory-intermediate',
  buildingType: 'factory',
  buildingId: FACTORY_ID,
  level: 'intermediate',
  title: ['Factory — Intermediate', 'Usine — Intermédiaire'],
  objective: ['Drive two Lathes that turn opposite ways with Gears.', 'Entraîner deux tours qui tournent en sens opposés avec des engrenages.'],
  initial: () => factoryCity('guided-factory-intermediate-v1', 3),
  steps: [
    {
      id: 'goal',
      title: ['Drive has a direction', 'La force a un sens'],
      objective: ['Know that some Machines turn only one way.', 'Savoir que certaines machines ne tournent que dans un sens.'],
      action: ['The room you see is an empty Tier 3 Factory interior. It supplies its own Urbs. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur d’usine de niveau 3, vide. Il fournit ses propres Urbs. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A Motor turns clockwise. A Lathe is built to turn clockwise or counter-clockwise and stays idle if it receives the other way. A Gear carries Drive along its axle, and its teeth mesh only with the teeth of another Gear, which reverses the turn. Lathes need a Tier 3 Factory.', 'Un moteur tourne dans le sens horaire. Un tour est construit pour tourner dans le sens horaire ou antihoraire et reste à l’arrêt s’il reçoit l’autre sens. Un engrenage transporte la force par son axe, et ses dents ne s’engrènent qu’avec celles d’un autre engrenage, ce qui inverse le sens. Les tours demandent une usine de niveau 3.'],
      result: ['By the end, one Motor drives a clockwise and a counter-clockwise Lathe.', 'À la fin, un moteur entraîne un tour horaire et un tour antihoraire.'],
      check: check(0, 0),
    },
    {
      id: 'motor-shaft',
      title: ['Start the transmission', 'Démarrer la transmission'],
      objective: ['Bring Drive to the middle of the floor.', 'Amener la force au milieu de l’atelier.'],
      action: ['Place the Motor, then a Shaft in front of it.', 'Place le moteur, puis un arbre devant lui.'],
      explanation: ['The Shaft carries the Drive along its axis, away from the Motor.', 'L’arbre transporte la force selon son axe, en s’éloignant du moteur.'],
      result: ['Drive reaches the end of the Shaft, but no Machine uses it yet.', 'La force arrive au bout de l’arbre, mais aucune machine ne l’utilise encore.'],
      commands: [place('factoryMotor', 0, 1, 3), place('factoryShaft', 1, 1, 3)],
      highlight: [{ x: 0, y: 1 }, { x: 1, y: 1 }],
      check: check(2, 0),
    },
    {
      id: 'gear',
      title: ['Connect a Gear by its axle', 'Raccorder un engrenage par son axe'],
      objective: ['Receive Drive the way a Gear should.', 'Recevoir la force comme un engrenage doit le faire.'],
      action: ['Place a Gear at the end of the Shaft, so the Shaft meets its axle.', 'Place un engrenage au bout de l’arbre, de sorte que l’arbre rejoigne son axe.'],
      explanation: ['A Gear takes and gives Drive only through its axle, on its left and right. Its front and back are teeth: they connect to the teeth of another Gear, never to a Shaft, a Motor or a Machine.', 'Un engrenage reçoit et donne la force uniquement par son axe, à gauche et à droite. Son avant et son arrière sont des dents : elles se connectent aux dents d’un autre engrenage, jamais à un arbre, un moteur ou une machine.'],
      result: ['The Gear turns clockwise with the Shaft. Its other axle end is free.', 'L’engrenage tourne dans le sens horaire avec l’arbre. L’autre bout de son axe est libre.'],
      commands: [place('factoryGear', 2, 1, 0)],
      highlight: [{ x: 2, y: 1 }],
      check: check(3, 0),
    },
    {
      id: 'lathe-ccw-wrong',
      title: ['Try the counter-clockwise Lathe', 'Essayer le tour antihoraire'],
      objective: ['See what a wrong turn looks like.', 'Voir ce que donne un mauvais sens de rotation.'],
      action: ['Place the counter-clockwise Lathe at the free end of the Gear axle.', 'Place le tour antihoraire au bout libre de l’axe de l’engrenage.'],
      explanation: ['The Lathe receives Drive through the axle, but the turn is clockwise, the wrong way for it. The game reports a wrong turn and the Lathe adds nothing.', 'Le tour reçoit la force par l’axe, mais le sens est horaire, le mauvais pour lui. Le jeu signale un mauvais sens et le tour n’apporte rien.'],
      result: ['The Lathe is placed but not linked: its bonus stays at zero.', 'Le tour est posé mais non relié : son bonus reste nul.'],
      commands: [place('factoryLatheCcw', 3, 1, 1)],
      highlight: [{ x: 3, y: 1 }],
      check: check(4, 0, true),
    },
    {
      id: 'gear-two',
      title: ['Reverse the turn with a second Gear', 'Inverser le sens avec un second engrenage'],
      objective: ['Prepare a counter-clockwise turn.', 'Préparer un sens antihoraire.'],
      action: ['Place a second Gear against the teeth of the first one.', 'Place un second engrenage contre les dents du premier.'],
      explanation: ['Two Gears whose teeth touch turn opposite ways. Teeth never meet an axle, and a ring of Gears that would have to turn both ways jams.', 'Deux engrenages dont les dents se touchent tournent en sens opposés. Les dents ne rencontrent jamais un axe, et un cercle d’engrenages qui devrait tourner dans les deux sens se bloque.'],
      result: ['The second Gear turns counter-clockwise. The Lathe is not on its axle yet.', 'Le second engrenage tourne dans le sens antihoraire. Le tour n’est pas encore sur son axe.'],
      commands: [place('factoryGear', 2, 2, 0)],
      highlight: [{ x: 2, y: 2 }],
      check: check(5, 0, true),
    },
    {
      id: 'move-lathe',
      title: ['Move the Lathe to the second Gear', 'Déplacer le tour sur le second engrenage'],
      objective: ['Give the Lathe the turn it needs.', 'Donner au tour le sens qu’il lui faut.'],
      action: ['Move the counter-clockwise Lathe to the axle of the second Gear.', 'Déplace le tour antihoraire sur l’axe du second engrenage.'],
      explanation: ['On the second Gear, the Lathe receives a counter-clockwise turn.', 'Sur le second engrenage, le tour reçoit un sens antihoraire.'],
      result: ['The Lathe is linked and now adds its bonus.', 'Le tour est relié et ajoute maintenant son bonus.'],
      commands: [{ type: 'MoveInteriorFixture', buildingId: FACTORY_ID, fixtureId: LATHE_CCW, x: 3, y: 2, rotation: 1 }],
      highlight: [{ x: 3, y: 2 }],
      check: check(5, 1),
    },
    {
      id: 'lathe-cw',
      title: ['Place the clockwise Lathe', 'Placer le tour horaire'],
      objective: ['Use both turns from one Motor.', 'Utiliser les deux sens avec un seul moteur.'],
      action: ['Place the clockwise Lathe on the free axle end of the first Gear.', 'Place le tour horaire au bout libre de l’axe du premier engrenage.'],
      explanation: ['The first Gear still turns clockwise, exactly what this Lathe needs.', 'Le premier engrenage tourne toujours dans le sens horaire, exactement ce dont ce tour a besoin.'],
      result: ['Both Lathes are linked, one clockwise and one counter-clockwise.', 'Les deux tours sont reliés, l’un horaire et l’autre antihoraire.'],
      commands: [place('factoryLatheCw', 3, 1, 1)],
      highlight: [{ x: 3, y: 1 }],
      check: check(6, 2),
    },
    {
      id: 'recap',
      title: ['Reproduce the layout', 'Reproduire le montage'],
      objective: ['Remember the rule and the benefit.', 'Retenir la règle et le bénéfice.'],
      action: ['Review the Motor, the Shaft, the two Gears and the two Lathes.', 'Revois le moteur, l’arbre, les deux engrenages et les deux tours.'],
      explanation: ['Feed a Gear through its axle and reverse the turn with a second Gear whose teeth touch the first. A Motor can drive up to three Machines. The Lathes cost 1,200 Urbs each, and the Motor draws more power as it drives more Machines.', 'Alimente un engrenage par son axe et inverse le sens avec un second engrenage dont les dents touchent celles du premier. Un moteur peut entraîner jusqu’à trois machines. Chaque tour coûte 1 200 Urbs, et le moteur consomme plus d’électricité quand il entraîne plus de machines.'],
      result: ['You can revisit any step or close this demonstration to return to your unchanged City.', 'Tu peux revoir n’importe quelle étape ou fermer cette démonstration pour retrouver ta ville inchangée.'],
      highlight: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 2 }],
      check: state => {
        check(6, 2)(state);
        const bonus = interiorBonusOfBuilding(demoFactory(state));
        if (bonus.speed <= 0 || bonus.power <= 0) throw new Error('expected a speed bonus and a power draw');
      },
    },
  ],
};
