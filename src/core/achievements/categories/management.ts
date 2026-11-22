import type { AchievementDef } from '../achievementTypes';

export const MANAGEMENT: readonly AchievementDef[] = [
  { id: 'management.secondCity', category: 'management', trigger: { type: 'signal', signal: 'cityCreated' },
    name: { en: 'Second City', fr: 'Seconde City' }, description: { en: 'Create another City.', fr: 'Créez une autre City.' } },
  { id: 'management.replan', category: 'management', trigger: { type: 'command', commands: ['FinishReplan'] },
    name: { en: 'Replan', fr: 'Replan' }, description: { en: 'Finish a Replan.', fr: 'Terminez un Replan.' } },
  { id: 'management.cloudSave', category: 'management', trigger: { type: 'signal', signal: 'cloudSaved' },
    flag: 'cloud',
    name: { en: 'Cloud save', fr: 'Cloud save' }, description: { en: 'Save your City to the Cloud.', fr: 'Sauvegardez votre City dans le Cloud.' } },
  { id: 'management.timeSkip', category: 'management', trigger: { type: 'command', commands: ['SkipTime', 'SkipToCycleHour'] },
    name: { en: 'Time skip', fr: 'Time skip' }, description: { en: 'Skip some time.', fr: 'Avancez le temps.' } },
  { id: 'management.analytics', category: 'management', trigger: { type: 'signal', signal: 'analyticsOpened' },
    name: { en: 'Analytics view', fr: 'Analytics view' }, description: { en: 'Open the Analytics view.', fr: 'Ouvrez l’Analytics view.' } },
  { id: 'management.advisor', category: 'management', trigger: { type: 'signal', signal: 'advisorAsked' },
    flag: 'advisor',
    name: { en: 'Ask the Advisor', fr: 'Demander à l’Advisor' }, description: { en: 'Ask the Advisor a question.', fr: 'Posez une question à l’Advisor.' } },
  { id: 'management.codex', category: 'management', trigger: { type: 'signal', signal: 'codexOpened' },
    name: { en: 'Read the Codex', fr: 'Lire le Codex' }, description: { en: 'Open the Codex.', fr: 'Ouvrez le Codex.' } },
];
