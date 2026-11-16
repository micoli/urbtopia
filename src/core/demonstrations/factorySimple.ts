import { createBuilding } from '../buildings/buildingSpecs';
import { newGame } from '../engine/newGame';
import { frontHasAccess } from '../map/placement';
import { unpoweredBuildingIds } from '../environment/powered';
import type { GameState } from '../engine/state';
import { interiorBonusOfBuilding } from '../factory/interiorBonus';
import { interiorLinksOf } from '../factory/interiorLinks';
import type { Demonstration, DemonstrationStep } from './scenario';

const BUILDING_ID = 1;
export const demoFactory = (state: GameState) => {
  const factory = state.buildings.find(building => building.id === BUILDING_ID);
  if (!factory) throw new Error('demonstration Factory missing');
  return factory;
};

const check = (count: number, linked: boolean): DemonstrationStep['check'] => state => {
  const factory = demoFactory(state);
  if (!frontHasAccess(state, factory.type, factory.x, factory.y, factory.rotation, factory.tier)) throw new Error('demonstration Factory needs Road access');
  if (unpoweredBuildingIds(state).has(factory.id)) throw new Error('demonstration Factory needs electricity');
  const fixtures = factory.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} Fixtures, got ${fixtures.length}`);
  const press = fixtures.find(fixture => fixture.type === 'factoryPress');
  const working = press !== undefined && interiorLinksOf(fixtures).linked.has(press.id);
  if (working !== linked) throw new Error(`expected linked Press: ${linked}`);
  const bonus = interiorBonusOfBuilding(factory);
  if (linked ? bonus.speed <= 0 || bonus.power <= 0 : bonus.speed !== 0) throw new Error('unexpected speed or power benefit');
};

export const factorySimple: Demonstration = {
  id: 'factory-simple',
  buildingType: 'factory',
  buildingId: BUILDING_ID,
  level: 'simple',
  title: ['Factory — Simple', 'Usine — Simple'],
  objective: ['Make a Press work with a Motor and a Shaft.', 'Faire fonctionner une presse avec un moteur et un arbre.'],
  initial: () => ({
    ...newGame({ now: 1_700_000_000_000, seed: 'guided-factory-simple-v1', tutorial: false, venueTutorials: false }),
    urbs: 10_000,
    buildings: [createBuilding(BUILDING_ID, 'factory', 60, 56, 2)],
    nextId: 2,
  }),
  steps: [
    {
      id: 'goal',
      title: ['A first working layout', 'Un premier montage fonctionnel'],
      objective: ['Understand how Drive reaches a Machine.', 'Comprendre comment la force d’entraînement arrive à une machine.'],
      action: ['The room you see is an empty Tier 1 Factory interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur d’usine de niveau 1, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['This demonstration supplies its own Urbs and Factory. In your City, you need a Tier 1 Factory, electricity and enough Urbs to buy the three pieces. The displayed purchase total comes from current prices.', 'Cette démonstration fournit ses propres Urbs et son usine. Dans ta ville, il faut une usine de niveau 1, de l’électricité et assez d’Urbs pour acheter les trois pièces. Le total d’achat affiché vient des prix actuels.'],
      result: ['Your City stays unchanged while you learn.', 'Ta ville reste inchangée pendant la démonstration.'],
      check: check(0, false),
    },
    {
      id: 'empty',
      title: ['Start from an empty interior', 'Partir d’un intérieur vide'],
      objective: ['Identify the baseline before adding equipment.', 'Repérer les indicateurs avant d’ajouter des équipements.'],
      action: ['Read the speed, yield and electricity indicators.', 'Lis les indicateurs de vitesse, de rendement et d’électricité.'],
      explanation: ['An empty interior adds no bonus and draws no extra motor power. The Factory still works normally without interior equipment.', 'Un intérieur vide n’ajoute aucun bonus et ne demande aucune électricité supplémentaire pour des moteurs. L’usine fonctionne normalement sans équipement intérieur.'],
      result: ['The interior adds no speed or yield.', 'L’intérieur n’ajoute ni vitesse ni rendement.'],
      check: check(0, false),
    },
    {
      id: 'press',
      title: ['Place the Press', 'Placer la presse'],
      objective: ['Introduce a Machine that needs Drive.', 'Présenter une machine qui a besoin de force d’entraînement.'],
      action: ['Place the Press on the highlighted cell, with its input facing the future Shaft.', 'Place la presse sur la case indiquée, son entrée tournée vers le futur arbre.'],
      explanation: ['A Press adds production speed only when its input receives Drive. It does not need a fluid circuit. Position alone does not make it work.', 'Une presse ajoute de la vitesse de production seulement lorsque son entrée reçoit la force d’entraînement. Elle n’a pas besoin de circuit de fluide. La poser ne suffit pas à la faire fonctionner.'],
      result: ['The Press is present, but unlinked: the speed bonus stays at zero.', 'La presse est présente, mais non reliée : le bonus de vitesse reste nul.'],
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: 'factoryPress', x: 2, y: 3, rotation: 2 }],
      highlight: [{ x: 2, y: 3 }],
      check: check(1, false),
    },
    {
      id: 'motor',
      title: ['Place the Motor', 'Placer le moteur'],
      objective: ['Supply the source of Drive.', 'Fournir la source de force d’entraînement.'],
      action: ['Place the Motor opposite the Press, leaving one cell for the Shaft.', 'Place le moteur face à la presse en laissant une case pour l’arbre.'],
      explanation: ['The Motor sends Drive through its front. It draws electricity even at idle, but the empty cell still interrupts the transmission.', 'Le moteur transmet la force d’entraînement par l’avant. Il demande de l’électricité même au ralenti, mais la case vide interrompt encore la transmission.'],
      result: ['The idle power demand appears. The Press still gives no bonus.', 'La demande électrique au ralenti apparaît. La presse n’apporte toujours aucun bonus.'],
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: 'factoryMotor', x: 2, y: 1, rotation: 0 }],
      highlight: [{ x: 2, y: 1 }],
      check: check(2, false),
    },
    {
      id: 'shaft',
      title: ['Connect the Shaft', 'Relier avec l’arbre'],
      objective: ['Complete the transmission.', 'Compléter la transmission.'],
      action: ['Place one straight Shaft in the gap between Motor and Press.', 'Place un arbre droit dans la case entre le moteur et la presse.'],
      explanation: ['The Shaft carries Drive along its axis. Its two ends must line up with the Motor output and the Press input; it does not transmit sideways.', 'L’arbre transporte la force selon son axe. Ses extrémités doivent être alignées avec la sortie du moteur et l’entrée de la presse ; il ne transmet pas la force sur le côté.'],
      result: ['The Press is linked and its speed bonus appears.', 'La presse est reliée et son bonus de vitesse apparaît.'],
      commands: [{ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: 'factoryShaft', x: 2, y: 2, rotation: 0 }],
      highlight: [{ x: 2, y: 2 }],
      check: check(3, true),
    },
    {
      id: 'orientation',
      title: ['Read the direction of the connection', 'Lire le sens de la connexion'],
      objective: ['Know why this orientation works.', 'Comprendre pourquoi cette orientation fonctionne.'],
      action: ['Follow the highlighted path: Motor → Shaft → Press.', 'Suis le trajet indiqué : moteur → arbre → presse.'],
      explanation: ['The Motor output, the Shaft axis and the Press input face each other. Turning the Press away or moving the Shaft off this line would break the Link. These three orientations are part of the layout.', 'La sortie du moteur, l’axe de l’arbre et l’entrée de la presse se font face. Tourner la presse dans l’autre sens ou décaler l’arbre couperait la liaison. Ces trois orientations font partie du montage.'],
      result: ['An unbroken, correctly oriented path brings Drive to the Machine.', 'Un trajet continu et correctement orienté apporte la force à la machine.'],
      highlight: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
      check: check(3, true),
    },
    {
      id: 'observe',
      title: ['Observe the working Machine', 'Observer la machine en fonctionnement'],
      objective: ['Connect the layout to the actual benefits.', 'Relier le montage aux bénéfices réels.'],
      action: ['Press Play to watch the transmission move, or keep it paused to inspect.', 'Appuie sur Lecture pour voir la transmission tourner, ou garde la pause pour examiner le montage.'],
      explanation: ['The indicators are calculated by the same rules as your Factory. A linked Press adds speed; its Motor now draws working power. Bonuses are limited by the Factory Tier.', 'Les indicateurs sont calculés par les mêmes règles que dans ton usine. Une presse reliée ajoute de la vitesse ; son moteur demande maintenant sa puissance de fonctionnement. Les bonus sont limités par le niveau de l’usine.'],
      result: ['Compare the positive speed bonus and active power demand with the empty and idle steps.', 'Compare le bonus de vitesse et la demande électrique avec les étapes vide et au ralenti.'],
      highlight: [{ x: 2, y: 3 }],
      check: check(3, true),
    },
    {
      id: 'recap',
      title: ['Reproduce the layout', 'Reproduire le montage'],
      objective: ['Remember the useful first setup and its cost.', 'Retenir ce premier montage utile et son coût.'],
      action: ['Review the three pieces, their alignment and the purchase total.', 'Revois les trois pièces, leur alignement et le total d’achat.'],
      explanation: ['One Motor, one Shaft and one Press are enough for this layout. Their purchase uses Urbs, the Motor adds electricity demand, and working equipment wears. Fluid circuits, complex transmissions and repairs are covered in later demonstrations.', 'Un moteur, un arbre et une presse suffisent pour ce montage. Leur achat coûte des Urbs, le moteur ajoute une demande électrique et les équipements en marche s’usent. Les circuits de fluide, transmissions complexes et réparations seront expliqués dans les démonstrations suivantes.'],
      result: ['You can revisit any step or close this demonstration to return to your unchanged City.', 'Tu peux revoir n’importe quelle étape ou fermer cette démonstration pour retrouver ta ville inchangée.'],
      highlight: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
      check: check(3, true),
    },
  ],
};
