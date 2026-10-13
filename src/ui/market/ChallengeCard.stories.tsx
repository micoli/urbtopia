import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Challenge } from '../../challenges/types';
import { ChallengeCard } from './ChallengeCard';

const daily: Challenge = {
  id: 'c1',
  kind: 'daily',
  difficulty: 'medium',
  minCitizens: 0,
  goal: [{ item: 'bricks', quantity: 10 }, { item: 'planks', quantity: 8 }],
  rewardKind: 'urbs',
  medalCode: null,
  nameKeys: { hook: 2, item: 'bricks' },
  nameFr: null,
  nameEn: null,
  startsAt: 0,
  endsAt: 86_400_000,
};

const meta = { title: 'Market/ChallengeCard', component: ChallengeCard, args: { challenge: daily, blocked: false, busy: false, onAccept: () => {} } } satisfies Meta<typeof ChallengeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Daily: Story = {};
export const Blocked: Story = { args: { blocked: true } };
export const Event: Story = { args: { challenge: { ...daily, kind: 'event', difficulty: null, rewardKind: 'medal', medalCode: 'port-festival', nameFr: 'Fête du port', nameEn: 'Port festival' } } };
