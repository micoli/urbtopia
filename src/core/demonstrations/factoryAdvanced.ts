import { frontHasAccess } from '../map/placement';
import { unpoweredBuildingIds } from '../environment/powered';
import { interiorBonusOfBuilding, interiorLinksOf } from '../factory/factoryInterior';
import { factoryCity, FACTORY_ID } from './factoryCity';
import { demoFactory } from './factorySimple';
import type { Demonstration, DemonstrationStep } from './scenario';

// Fixture ids follow the order of placement: the Mixing vat is 1.
const VAT = 1;
// The fourth Press of the branch has the highest id, so it is the one its Motor stops serving.
const OVERLOADED_PRESS = 13;

interface Expected {
  count: number;
  vatLinked: boolean;
  linkedPresses?: number;
  overloaded?: boolean;
}

const check = ({ count, vatLinked, linkedPresses = 0, overloaded = false }: Expected): DemonstrationStep['check'] => state => {
  const factory = demoFactory(state);
  if (!frontHasAccess(state, factory.type, factory.x, factory.y, factory.rotation, factory.tier)) throw new Error('demonstration Factory needs Road access');
  if (unpoweredBuildingIds(state).has(factory.id)) throw new Error('demonstration Factory needs electricity');
  const fixtures = factory.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} Fixtures, got ${fixtures.length}`);
  const links = interiorLinksOf(fixtures);
  if (links.jammed) throw new Error('unexpected jammed Gears');
  if (links.linked.has(VAT) !== vatLinked) throw new Error(`expected linked Mixing vat: ${vatLinked}`);
  const presses = fixtures.filter(fixture => fixture.type === 'factoryPress' && links.linked.has(fixture.id)).length;
  if (presses !== linkedPresses) throw new Error(`expected ${linkedPresses} linked Presses, got ${presses}`);
  const hasOverload = [...links.problems.values()].some(problems => problems.includes('overloaded'));
  if (hasOverload !== overloaded) throw new Error(`expected overloaded Machine: ${overloaded}`);
};

type Placed = 'factoryMixingVat' | 'factoryTank' | 'factoryPump' | 'factoryPipeTee' | 'factoryMotor' | 'factoryGear' | 'factoryPress';
const place = (fixture: Placed, x: number, y: number, rotation: 0 | 1 | 2 | 3) => ({ type: 'PlaceInteriorFixture' as const, buildingId: FACTORY_ID, fixture, x, y, rotation });

export const factoryAdvanced: Demonstration = {
  id: 'factory-advanced',
  buildingType: 'factory',
  buildingId: FACTORY_ID,
  level: 'advanced',
  title: ['Factory — Advanced', 'Usine — Avancé'],
  objective: ['Supply a Mixing vat with Flow and share Motors without overloading them.', 'Alimenter une cuve de mélange en fluide et répartir les moteurs sans les surcharger.'],
  initial: () => factoryCity('guided-factory-advanced-v1', 2),
  steps: [
    {
      id: 'goal',
      title: ['Two supplies: Flow and Drive', 'Deux alimentations : fluide et force'],
      objective: ['Know what a Machine can lack.', 'Savoir ce qui peut manquer à une machine.'],
      action: ['The room you see is an empty Tier 2 Factory interior. It supplies its own Urbs. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur d’usine de niveau 2, vide. Il fournit ses propres Urbs. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A Mixing vat needs Flow: a Tank, a Pump that pushes it, and Pipes to the vat. The Pump itself needs Drive from a Motor. Each Motor can serve only three Machines or Pumps at once; the others stop, and the game says so. A Gear carries Drive only through its axle; its teeth meet only the teeth of another Gear.', 'Une cuve de mélange a besoin de fluide : un réservoir, une pompe qui le pousse, et des tuyaux jusqu’à la cuve. La pompe elle-même a besoin de force d’un moteur. Chaque moteur ne peut servir que trois machines ou pompes à la fois ; les autres s’arrêtent, et le jeu l’indique. Un engrenage transporte la force uniquement par son axe ; ses dents ne rencontrent que celles d’un autre engrenage.'],
      result: ['You will build a working Flow circuit, then a Drive branch that you diagnose and fix.', 'Tu vas construire un circuit de fluide, puis une dérivation de force que tu diagnostiques et corriges.'],
      check: check({ count: 0, vatLinked: false }),
    },
    {
      id: 'vat',
      title: ['Place the Mixing vat', 'Placer la cuve de mélange'],
      objective: ['Start from the Machine that needs Flow.', 'Partir de la machine qui a besoin de fluide.'],
      action: ['Place the Mixing vat with its inlet facing the future Pipe.', 'Place la cuve de mélange, son entrée tournée vers le futur tuyau.'],
      explanation: ['The vat has a single Flow inlet. Without Flow it adds nothing.', 'La cuve n’a qu’une entrée de fluide. Sans fluide, elle n’apporte rien.'],
      result: ['The vat is present but lacks Flow.', 'La cuve est présente mais manque de fluide.'],
      commands: [place('factoryMixingVat', 0, 2, 3)],
      highlight: [{ x: 0, y: 2 }],
      check: check({ count: 1, vatLinked: false }),
    },
    {
      id: 'tank',
      title: ['Place the Tank', 'Placer le réservoir'],
      objective: ['Provide the source of Flow.', 'Fournir la source de fluide.'],
      action: ['Place the Tank at the top, with its outlet facing down.', 'Place le réservoir en haut, sa sortie tournée vers le bas.'],
      explanation: ['The Tank stores the fluid and gives it through its front. It has no motor: something must push the fluid on.', 'Le réservoir stocke le fluide et le donne par l’avant. Il n’a pas de moteur : il faut quelque chose pour pousser le fluide.'],
      result: ['Nothing moves yet.', 'Rien ne bouge encore.'],
      commands: [place('factoryTank', 1, 0, 0)],
      highlight: [{ x: 1, y: 0 }],
      check: check({ count: 2, vatLinked: false }),
    },
    {
      id: 'pump',
      title: ['Place the Pump', 'Placer la pompe'],
      objective: ['Push the fluid onward.', 'Pousser le fluide plus loin.'],
      action: ['Place the Pump under the Tank. Its Drive input faces right.', 'Place la pompe sous le réservoir. Son entrée de force est tournée vers la droite.'],
      explanation: ['A Pump passes Flow front to back, but only when it is driven. Its Drive input is on one side, here the right.', 'Une pompe fait passer le fluide d’avant en arrière, mais seulement si elle est entraînée. Son entrée de force est sur un côté, ici la droite.'],
      result: ['The Pump is in line with the Tank, but stopped.', 'La pompe est alignée avec le réservoir, mais à l’arrêt.'],
      commands: [place('factoryPump', 1, 1, 0)],
      highlight: [{ x: 1, y: 1 }],
      check: check({ count: 3, vatLinked: false }),
    },
    {
      id: 'pipe',
      title: ['Connect the Pipe', 'Raccorder le tuyau'],
      objective: ['Bring the Flow to the vat.', 'Amener le fluide jusqu’à la cuve.'],
      action: ['Place a three-way Pipe under the Pump, opening toward the vat.', 'Place un tuyau en T sous la pompe, ouvert vers la cuve.'],
      explanation: ['A Pipe joins two Flow sides that face each other. The three-way Pipe lets Flow turn toward the vat and keeps a spare branch.', 'Un tuyau relie deux côtés de fluide qui se font face. Le tuyau en T permet au fluide de tourner vers la cuve et garde une branche libre.'],
      result: ['The path exists from Tank to vat, but the Pump has no Drive: the vat is still not supplied.', 'Le trajet existe du réservoir à la cuve, mais la pompe n’a pas de force : la cuve n’est toujours pas alimentée.'],
      commands: [place('factoryPipeTee', 1, 2, 2)],
      highlight: [{ x: 1, y: 2 }],
      check: check({ count: 4, vatLinked: false }),
    },
    {
      id: 'motor',
      title: ['Drive the Pump', 'Entraîner la pompe'],
      objective: ['Supply the missing Drive.', 'Fournir la force manquante.'],
      action: ['Place a Motor on the right of the Pump, facing it.', 'Place un moteur à droite de la pompe, tourné vers elle.'],
      explanation: ['The Motor hands Drive to the Pump, which pushes the fluid from the Tank through the Pipe to the vat.', 'Le moteur donne la force à la pompe, qui pousse le fluide du réservoir jusqu’à la cuve par le tuyau.'],
      result: ['The vat is supplied: its yield bonus appears and the Motor draws power.', 'La cuve est alimentée : son bonus de rendement apparaît et le moteur consomme de l’électricité.'],
      commands: [place('factoryMotor', 2, 1, 1)],
      highlight: [{ x: 2, y: 1 }],
      check: check({ count: 5, vatLinked: true }),
    },
    {
      id: 'branch',
      title: ['Build a Drive branch', 'Construire une dérivation de force'],
      objective: ['Prepare several Machines on one Motor.', 'Préparer plusieurs machines sur un seul moteur.'],
      action: ['Place a Motor facing a Gear, then a second Gear against the first one’s teeth.', 'Place un moteur face à un engrenage, puis un second engrenage contre les dents du premier.'],
      explanation: ['The Motor feeds the first Gear through its axle. The second Gear meshes with its teeth and has two axle ends of its own, so one Motor can reach several Machines. This group is separate from the Pump.', 'Le moteur alimente le premier engrenage par son axe. Le second engrenage s’engrène par ses dents et a deux bouts d’axe, donc un seul moteur peut atteindre plusieurs machines. Ce groupe est séparé de la pompe.'],
      result: ['Drive is ready at three axle ends.', 'La force est prête à trois bouts d’axe.'],
      commands: [place('factoryMotor', 4, 3, 3), place('factoryGear', 5, 3, 0), place('factoryGear', 5, 4, 0)],
      highlight: [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 4 }],
      check: check({ count: 8, vatLinked: true }),
    },
    {
      id: 'presses-first',
      title: ['Add three Presses', 'Ajouter trois presses'],
      objective: ['Use the branch within the Motor’s capacity.', 'Utiliser la dérivation dans la limite du moteur.'],
      action: ['Place a Press at each free axle end, facing its Gear.', 'Place une presse à chaque bout d’axe libre, tournée vers son engrenage.'],
      explanation: ['A Motor drives up to three Machines or Pumps. Three Presses use exactly that capacity.', 'Un moteur entraîne jusqu’à trois machines ou pompes. Trois presses utilisent exactement cette capacité.'],
      result: ['All three Presses are linked.', 'Les trois presses sont reliées.'],
      commands: [place('factoryPress', 6, 3, 1), place('factoryPress', 4, 4, 3), place('factoryPress', 6, 4, 1)],
      highlight: [{ x: 6, y: 3 }, { x: 4, y: 4 }, { x: 6, y: 4 }],
      check: check({ count: 11, vatLinked: true, linkedPresses: 3 }),
    },
    {
      id: 'presses-overload',
      title: ['Diagnose an overload', 'Diagnostiquer une surcharge'],
      objective: ['Recognise a Motor asked to do too much.', 'Reconnaître un moteur à qui l’on en demande trop.'],
      action: ['Add a third Gear against the first one’s teeth and a fourth Press on its axle.', 'Ajoute un troisième engrenage contre les dents du premier et une quatrième presse sur son axe.'],
      explanation: ['The group now holds four Presses for one Motor that serves three. The Press with the highest id stops, and the game marks it overloaded.', 'Le groupe compte maintenant quatre presses pour un moteur qui en sert trois. La presse qui a le plus grand identifiant s’arrête, et le jeu la marque en surcharge.'],
      result: ['Only three Presses are linked: the fourth is overloaded.', 'Seulement trois presses sont reliées : la quatrième est en surcharge.'],
      commands: [place('factoryGear', 5, 2, 0), place('factoryPress', 4, 2, 3)],
      highlight: [{ x: 5, y: 2 }, { x: 4, y: 2 }],
      check: check({ count: 13, vatLinked: true, linkedPresses: 3, overloaded: true }),
    },
    {
      id: 'own-motor',
      title: ['Fix it with a separate Motor', 'Corriger avec un moteur séparé'],
      objective: ['Add the missing capacity.', 'Ajouter la capacité manquante.'],
      action: ['Move the overloaded Press to the top right and give it its own Motor.', 'Déplace la presse en surcharge en haut à droite et donne-lui son propre moteur.'],
      explanation: ['A second Motor wired into the same Gears would force them to turn two ways and jam them. A Press fed directly by its own Motor is a separate group, so the branch keeps three Machines.', 'Un second moteur branché sur les mêmes engrenages les forcerait à tourner dans deux sens et les bloquerait. Une presse alimentée directement par son propre moteur forme un groupe séparé, donc la dérivation garde trois machines.'],
      result: ['All four Presses are linked and the overload is gone.', 'Les quatre presses sont reliées et la surcharge a disparu.'],
      commands: [
        place('factoryMotor', 6, 1, 0),
        { type: 'MoveInteriorFixture', buildingId: FACTORY_ID, fixtureId: OVERLOADED_PRESS, x: 6, y: 2, rotation: 2 },
      ],
      highlight: [{ x: 6, y: 1 }, { x: 6, y: 2 }],
      check: check({ count: 14, vatLinked: true, linkedPresses: 4 }),
    },
    {
      id: 'recap',
      title: ['Reproduce the layout', 'Reproduire le montage'],
      objective: ['Remember the diagnosis and its cost.', 'Retenir le diagnostic et son coût.'],
      action: ['Review the Flow circuit, the Drive branch and the separate Motor.', 'Revois le circuit de fluide, la dérivation de force et le moteur séparé.'],
      explanation: ['When a Machine does not run, check what it lacks: Flow, Drive, the right turn, or Motor capacity. A Mixing vat needs its Tank, Pump, Pipe and Drive; a Motor serves three Machines, so give the fourth its own Motor. Every added Motor raises the power draw.', 'Quand une machine ne tourne pas, cherche ce qui lui manque : fluide, force, bon sens de rotation ou capacité du moteur. Une cuve de mélange demande son réservoir, sa pompe, son tuyau et de la force ; un moteur sert trois machines, donc donne son propre moteur à la quatrième. Chaque moteur ajouté augmente la consommation électrique.'],
      result: ['You can revisit any step or close this demonstration to return to your unchanged City.', 'Tu peux revoir n’importe quelle étape ou fermer cette démonstration pour retrouver ta ville inchangée.'],
      highlight: [{ x: 0, y: 2 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 1 }],
      check: state => {
        check({ count: 14, vatLinked: true, linkedPresses: 4 })(state);
        const bonus = interiorBonusOfBuilding(demoFactory(state));
        if (bonus.yield <= 0 || bonus.speed <= 0 || bonus.power <= 0) throw new Error('expected speed, yield and a power draw');
      },
    },
  ],
};
