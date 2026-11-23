import type { AchievementDef } from '../achievementTypes';

export const POLITICS: readonly AchievementDef[] = [
  { id: 'politics.townHall', category: 'politics', trigger: { type: 'created', counter: 'building:townHall' },
    fromDifficulty: 'easy',
    name: { en: 'Town hall open', fr: 'Hôtel de ville ouvert' }, description: { en: 'Place a Town hall.', fr: 'Posez un Town hall.' } },
  { id: 'politics.ordinance', category: 'politics', trigger: { type: 'sim', event: 'OrdinanceAdopted' },
    fromDifficulty: 'easy',
    name: { en: 'Ordinance passed', fr: 'Ordinance adoptée' }, description: { en: 'Have the Council adopt an Ordinance.', fr: 'Faites adopter une Ordinance par le Council.' } },
  { id: 'politics.objective', category: 'politics', trigger: { type: 'created', counter: 'objectivesCompleted' },
    fromDifficulty: 'easy',
    name: { en: 'Objective met', fr: 'Objective atteint' }, description: { en: 'Hold an Objective until it is met.', fr: 'Tenez un Objective jusqu’à ce qu’il soit atteint.' } },
  { id: 'politics.grant', category: 'politics', trigger: { type: 'command', commands: ['ClaimGrants'] },
    fromDifficulty: 'easy',
    name: { en: 'Grant claimed', fr: 'Grant réclamé' }, description: { en: 'Claim the Grants the State owes you.', fr: 'Percevez les Grants dus par l’État.' } },
  { id: 'politics.election', category: 'politics', trigger: { type: 'created', counter: 'electionsHeld' },
    fromDifficulty: 'easy',
    name: { en: 'Facing the voters', fr: 'Face aux électeurs' }, description: { en: 'Go through an Election.', fr: 'Passez une Election.' } },
];
