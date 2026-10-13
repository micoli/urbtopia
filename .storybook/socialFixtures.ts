import type { GroupActions, SocialActions } from '../src/store/socialStore';
import type { Group, SocialState } from '../src/social/types';

const NOW = 1_790_000_000_000;
const HOUR = 3_600_000;

const resolved = () => Promise.resolve();
const accepted = () => Promise.resolve({ ok: true as const, offerId: null });

export const SOCIAL_ACTIONS: SocialActions = {
  refresh: resolved,
  poll: resolved,
  sendRequest: resolved,
  accept: resolved,
  refuse: resolved,
  remove: resolved,
  block: resolved,
  unblock: resolved,
  openConversation: resolved,
  closeConversation: resolved,
  sendMessage: resolved,
  pollConversation: resolved,
  refreshConversation: resolved,
  createTradeOffer: accepted,
  acceptTradeOffer: accepted,
  declineTradeOffer: accepted,
  reconcileTrades: resolved,
  setHandle: resolved,
  setAvatar: resolved,
  setFindable: resolved,
};

const created = () => Promise.resolve(true);

export const GROUP_ACTIONS: GroupActions = {
  refresh: resolved,
  poll: resolved,
  create: created,
  rename: created,
  addMembers: created,
  removeMember: resolved,
  blockMember: resolved,
  leave: resolved,
  remove: resolved,
  open: resolved,
  close: resolved,
  send: resolved,
  pollOpen: resolved,
  refreshOpen: resolved,
};

export const SOCIAL_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'River builders',
    creatorId: 'me',
    members: [
      { userId: 'me', handle: 'MayorStory', avatar: 'character-female-a' },
      { userId: 'friend-1', handle: 'RiverCity', avatar: 'character-male-b' },
      { userId: 'friend-2', handle: 'HillTown', avatar: null },
    ],
    unread: 2,
    lastMessageAt: NOW - HOUR,
    lastMessageFrom: 'RiverCity',
    lastMessagePreview: 'Who has spare planks?',
  },
  { id: 'group-2', name: 'Night owls', creatorId: 'friend-1', members: [{ userId: 'me', handle: 'MayorStory', avatar: 'character-female-a' }, { userId: 'friend-1', handle: 'RiverCity', avatar: 'character-male-b' }], unread: 0, lastMessageAt: null, lastMessageFrom: null, lastMessagePreview: null },
];

export const SOCIAL_PROFILE: SocialState = {
  revision: 1,
  handle: 'MayorStory',
  avatar: 'character-female-a',
  findable: true,
  handleChangedAt: NOW - 48 * HOUR,
  friends: [
    { userId: 'friend-1', handle: 'RiverCity', avatar: 'character-male-b', since: NOW - 72 * HOUR, unread: 2, lastMessageAt: NOW - HOUR },
    { userId: 'friend-2', handle: 'HillTown', avatar: null, since: NOW - 24 * HOUR, unread: 0, lastMessageAt: null },
  ],
  incoming: [{ userId: 'user-3', handle: 'NewNeighbour', avatar: 'character-female-d', at: NOW - HOUR }],
  outgoing: [{ userId: 'user-4', handle: 'FarAway', avatar: null, at: NOW - 2 * HOUR }],
  blocked: [{ userId: 'user-5', handle: 'Grumpy', avatar: null }],
  offers: [
    {
      id: 'offer-1',
      role: 'recipient',
      peerId: 'friend-1',
      peerHandle: 'RiverCity',
      peerAvatar: 'character-male-b',
      lot: [{ item: 'planks', quantity: 20 }],
      price: 150,
      state: 'open',
      createdAt: NOW - HOUR,
      expiresAt: NOW + 23 * HOUR,
      claimDeadline: null,
      claimable: [],
      claimed: [],
    },
  ],
};
