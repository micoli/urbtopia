import { createBuilding } from '../buildings/buildingSpecs';
import type { Command } from '../engine/commands';
import type { FixtureId, Rotation } from '../engine/state';
import { assignedFixturesOf, interiorLinksOf, type GoodId } from '../index';
import { BUILDING_ID, lineCity, roomOf } from './lineInterior';
import type { Demonstration, DemonstrationStep } from './scenario';

const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation): Command =>
  ({ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture, x, y, rotation });

export const checkMill = (count: number, linked: boolean, lined = false, assigned = false): DemonstrationStep['check'] => state => {
  const interior = roomOf(state).interior;
  const fixtures = interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} fixtures, got ${fixtures.length}`);
  const stone = fixtures.find(fixture => fixture.type === 'millstone' || fixture.type === 'millstoneRight');
  const links = interiorLinksOf(fixtures);
  if ((stone !== undefined && links.linked.has(stone.id)) !== linked) throw new Error(`expected millstone linked: ${linked}`);
  if ((stone !== undefined && links.lined.has(stone.id)) !== lined) throw new Error(`expected millstone line: ${lined}`);
  if ((assignedFixturesOf(interior, 'miller').length === 1) !== assigned) throw new Error(`expected assigned miller: ${assigned}`);
};
const check = checkMill;

export const millSimple: Demonstration = {
  id: 'mill-simple', buildingType: 'mill', buildingId: BUILDING_ID, level: 'simple',
  title: ['Mill — Simple', 'Moulin — Simple'],
  objective: ['Make olive oil with a millstone and a miller.', 'Produire de l’huile d’olive avec une meule et un meunier.'],
  initial: () => {
    const state = lineCity('mill', 'guided-mill-simple-v1', 1);
    return { ...state, buildings: [...state.buildings, createBuilding(2, 'storehouse', 70, 50, 0)], storage: { ...state.storage, materials: { ...state.storage.materials, olive: 100 } } };
  },
  steps: [
    {
      id: 'goal', title: ['An oil mill', 'Un moulin à huile'],
      objective: ['Prepare an automatic oil line.', 'Préparer une chaîne automatique d’huile.'],
      action: ['The room you see is an empty Tier 1 Mill interior. You will fit it out piece by piece.', 'La salle que tu vois est un intérieur de moulin de niveau 1, vide. Tu vas l’équiper pièce par pièce.'],
      explanation: ['A driven millstone needs a cleaner, a driven pump, an oil tank and a miller to produce oil automatically.', 'Une meule entraînée a besoin d’une nettoyeuse, d’une pompe entraînée, d’un réservoir d’huile et d’un meunier pour produire automatiquement.'],
      result: ['The room is empty and your own city is unchanged.', 'La salle est vide et ta propre ville reste inchangée.'], check: check(0, false),
    },
    {
      id: 'stone', title: ['Place the millstone', 'Placer la meule'],
      objective: ['Choose the machine that presses olives.', 'Choisir la machine qui presse les olives.'],
      action: ['Place the millstone in the room.', 'Place la meule dans la salle.'],
      explanation: ['Its drive input faces the future motor.', 'Son entrée de force fait face au futur moteur.'], result: ['The millstone has no drive yet.', 'La meule n’est pas encore entraînée.'],
      commands: [place('millstone', 2, 2, 2)], highlight: [{ x: 2, y: 2 }], check: check(1, false),
    },
    {
      id: 'motor', title: ['Drive the millstone', 'Entraîner la meule'], objective: ['Connect its motor.', 'Raccorder son moteur.'],
      action: ['Place a motor facing the millstone.', 'Place un moteur face à la meule.'],
      explanation: ['The motor supplies drive through the millstone’s front, but the millstone also needs flow.', 'Le moteur fournit la force par l’avant de la meule, mais la meule a aussi besoin de fluide.'], result: ['The motor is connected; the millstone still lacks flow.', 'Le moteur est raccordé ; il manque encore du fluide à la meule.'],
      commands: [place('millMotor', 2, 1, 0)], highlight: [{ x: 2, y: 1 }], check: check(2, false),
    },
    {
      id: 'cleaner', title: ['Place the cleaner', 'Placer la nettoyeuse'], objective: ['Prepare the intake.', 'Préparer l’entrée.'],
      action: ['Place the cleaner behind the millstone.', 'Place la nettoyeuse derrière la meule.'],
      explanation: ['The cleaner connects the incoming flow to the millstone.', 'La nettoyeuse relie le fluide entrant à la meule.'], result: ['The intake still needs a pump.', 'L’entrée a encore besoin d’une pompe.'],
      commands: [place('millCleaner', 2, 3, 0)], highlight: [{ x: 2, y: 3 }], check: check(3, false),
    },
    {
      id: 'tank', title: ['Place the oil tank', 'Placer le réservoir d’huile'], objective: ['Provide an oil output.', 'Fournir une sortie pour l’huile.'],
      action: ['Place the oil tank to the right of the millstone, facing it.', 'Place le réservoir d’huile à droite de la meule, tourné vers elle.'],
      explanation: ['The tank receives the millstone’s side output.', 'Le réservoir reçoit la sortie latérale de la meule.'], result: ['The output is in place.', 'La sortie est en place.'],
      commands: [place('millOilTank', 3, 2, 1)], highlight: [{ x: 3, y: 2 }], check: check(4, false),
    },
    {
      id: 'pump', title: ['Place the pump', 'Placer la pompe'], objective: ['Connect the flow to the cleaner.', 'Raccorder le fluide à la nettoyeuse.'],
      action: ['Place the pump below the cleaner.', 'Place la pompe sous la nettoyeuse.'],
      explanation: ['The pump pushes flow through the cleaner but needs drive of its own.', 'La pompe pousse le fluide dans la nettoyeuse mais a besoin de sa propre force.'], result: ['The pump is not driven yet.', 'La pompe n’est pas encore entraînée.'],
      commands: [place('millPump', 2, 4, 2)], highlight: [{ x: 2, y: 4 }], check: check(5, false),
    },
    {
      id: 'pump-motor', title: ['Drive the pump', 'Entraîner la pompe'], objective: ['Supply the pump with drive.', 'Fournir la force à la pompe.'],
      action: ['Place a motor beside the pump, facing its drive input.', 'Place un moteur à côté de la pompe, face à son entrée de force.'],
      explanation: ['A powered pump supplies the connected flow circuit.', 'Une pompe entraînée alimente le circuit de fluide raccordé.'], result: ['The circuit is ready for a recipe.', 'Le circuit est prêt pour une recette.'],
      commands: [place('millMotor', 1, 4, 3)], highlight: [{ x: 1, y: 4 }], check: check(6, true),
    },
    {
      id: 'recipe', title: ['Select olive oil', 'Choisir l’huile d’olive'], objective: ['Choose what to produce.', 'Choisir la production.'],
      action: ['Select olive oil on the millstone.', 'Choisis l’huile d’olive sur la meule.'],
      explanation: ['The selected recipe determines the required output.', 'La recette choisie détermine la sortie nécessaire.'], result: ['The oil line is complete.', 'La chaîne d’huile est complète.'],
      commands: [{ type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId: 1, good: 'oliveOil' as GoodId }], highlight: [{ x: 2, y: 2 }], check: check(6, true, true),
    },
    {
      id: 'hire', title: ['Hire a miller', 'Embaucher un meunier'], objective: ['Provide a worker.', 'Recruter un employé.'],
      action: ['Hire a miller.', 'Embauche un meunier.'], explanation: ['The miller must be assigned to the millstone.', 'Le meunier doit être affecté à la meule.'], result: ['The miller is available.', 'Le meunier est disponible.'],
      commands: [{ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'miller' }], check: check(6, true, true),
    },
    {
      id: 'assign', title: ['Assign the miller', 'Affecter le meunier'], objective: ['Start automatic production.', 'Démarrer la production automatique.'],
      action: ['Assign the miller to the millstone.', 'Affecte le meunier à la meule.'], explanation: ['With olives available and room in storage, the miller starts the selected recipe.', 'Avec des olives disponibles et de la place en stockage, le meunier lance la recette choisie.'], result: ['The millstone is ready to produce oil.', 'La meule est prête à produire de l’huile.'],
      commands: [{ type: 'AssignInteriorStaff', buildingId: BUILDING_ID, fixtureId: 1 }], highlight: [{ x: 2, y: 2 }], check: check(6, true, true, true),
    },
  ],
};
