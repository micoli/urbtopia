import type { AchievementDef } from '../achievementTypes';

export const SOCIAL: readonly AchievementDef[] = [
  { id: 'social.handle', category: 'social', trigger: { type: 'signal', signal: 'handleSet' },
    flag: 'cloud',
    name: { en: 'A Handle of your own', fr: 'Un Handle à vous' }, description: { en: 'Choose a Handle.', fr: 'Choisissez un Handle.' } },
  { id: 'social.friendRequest', category: 'social', trigger: { type: 'signal', signal: 'friendRequestSent' },
    flag: 'cloud',
    name: { en: 'Friend request', fr: 'Demande d’ami' }, description: { en: 'Send a Friend request.', fr: 'Envoyez une Friend request.' } },
  { id: 'social.tradeOffer', category: 'social', trigger: { type: 'signal', signal: 'tradeOfferCreated' },
    flag: 'cloud',
    name: { en: 'Trade offer', fr: 'Trade offer' }, description: { en: 'Make a Trade offer to a Friend.', fr: 'Faites une Trade offer à un Friend.' } },
  { id: 'social.donation', category: 'social', trigger: { type: 'command', commands: ['DonateItems'] },
    name: { en: 'Donation', fr: 'Donation' }, description: { en: 'Make a Donation.', fr: 'Faites une Donation.' } },
  { id: 'social.challenge', category: 'social', trigger: { type: 'command', commands: ['ChallengeStart'] },
    flag: 'cloud',
    name: { en: 'Challenge accepted', fr: 'Challenge relevé' }, description: { en: 'Accept a Challenge.', fr: 'Acceptez un Challenge.' } },
  { id: 'social.visit', category: 'social', trigger: { type: 'signal', signal: 'visitStarted' },
    flag: 'cloud',
    name: { en: 'Visit', fr: 'Visite' }, description: { en: 'Visit the Showcase of another City.', fr: 'Visitez le Showcase d’une autre City.' } },
];
