import type { AchievementDef } from '../achievementTypes';

export const INTERIORS: readonly AchievementDef[] = [
  { id: 'interiors.open', category: 'interiors', trigger: { type: 'signal', signal: 'interiorOpened' },
    name: { en: 'Behind the door', fr: 'Derrière la porte' }, description: { en: 'Open the interior of a building.', fr: 'Ouvrez l’intérieur d’un bâtiment.' } },
  { id: 'interiors.staff', category: 'interiors', trigger: { type: 'command', commands: ['HireInteriorStaff', 'AssignInteriorStaff', 'HireStaff'] },
    name: { en: 'Staffed', fr: 'Du personnel' }, description: { en: 'Hire or assign Staff in an interior.', fr: 'Embauchez ou affectez du Staff dans un intérieur.' } },
  { id: 'interiors.fixture', category: 'interiors', trigger: { type: 'created', counter: 'interiorFixtures' },
    name: { en: 'First Machine', fr: 'Première Machine' }, description: { en: 'Place a Fixture in a production interior.', fr: 'Posez un Fixture dans un intérieur de production.' } },
  { id: 'interiors.repair', category: 'interiors', trigger: { type: 'command', commands: ['RepairFixture', 'RepairInteriorFixture', 'RepairAllInteriorFixtures', 'HireInteriorTechnician'] },
    name: { en: 'Keep it running', fr: 'Toujours en marche' }, description: { en: 'Repair a Fixture or hire a technician.', fr: 'Réparez un Fixture ou embauchez un technicien.' } },
  { id: 'interiors.demonstration', category: 'interiors', trigger: { type: 'signal', signal: 'demonstrationFinished' },
    name: { en: 'Guided demonstration', fr: 'Démonstration guidée' }, description: { en: 'Watch a Guided demonstration to its last step.', fr: 'Regardez une Guided demonstration jusqu’à sa dernière étape.' } },
  { id: 'interiors.homeFixture', category: 'interiors', trigger: { type: 'created', counter: 'homeFixtures' },
    name: { en: 'Furnished Home', fr: 'Home meublé' }, description: { en: 'Place a Fixture in a Home interior.', fr: 'Posez un Fixture dans l’intérieur d’un Home.' } },
];
