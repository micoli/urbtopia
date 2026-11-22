import type { AchievementDef } from '../achievementTypes';

export const LEISURE: readonly AchievementDef[] = [
  { id: 'leisure.casino', category: 'leisure', trigger: { type: 'command', commands: ['PlaySlotMachine', 'StartCasinoRound'] },
    name: { en: 'Try your luck', fr: 'Tentez votre chance' }, description: { en: 'Play a Round in a Casino.', fr: 'Jouez un Round dans un Casino.' } },
  { id: 'leisure.gathering', category: 'leisure', trigger: { type: 'sim', event: 'GatheringSettled' },
    name: { en: 'Show time', fr: 'Le spectacle commence' }, description: { en: 'Hold a Gathering in an Arena and collect its Ticket sales.', fr: 'Tenez un Gathering dans une Arena et encaissez ses Tickets.' } },
  { id: 'leisure.club', category: 'leisure', trigger: { type: 'command', commands: ['FoundClub'] },
    name: { en: 'A club of your own', fr: 'Un club à vous' }, description: { en: 'Found a Club.', fr: 'Fondez un Club.' } },
  { id: 'leisure.attraction', category: 'leisure', trigger: { type: 'created', counter: 'attractions' },
    name: { en: 'Visitors arrive', fr: 'Les Visitors arrivent' }, description: { en: 'Place an Attraction.', fr: 'Posez une Attraction.' } },
  { id: 'leisure.marina', category: 'leisure', trigger: { type: 'created', counter: 'building:marina' },
    name: { en: 'Set sail', fr: 'Cap sur la mer' }, description: { en: 'Place a Marina.', fr: 'Posez une Marina.' } },
];
