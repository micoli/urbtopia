import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlackjackFelt } from './BlackjackFelt';

const meta = {
  title: 'Casino/BlackjackFelt',
  component: BlackjackFelt,
  parameters: { layout: 'fullscreen' },
  args: {
    dealer: [{ rank: 'K', suit: 'clubs' }, { rank: '6', suit: 'hearts' }],
    player: [{ rank: '9', suit: 'spades' }, { rank: '8', suit: 'diamonds' }],
    holeCardHidden: true,
    winner: null,
  },
} satisfies Meta<typeof BlackjackFelt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};
export const PlayerWins: Story = { args: { holeCardHidden: false, winner: 'player' } };
export const DealerWins: Story = { args: { holeCardHidden: false, winner: 'dealer' } };
export const Push: Story = { args: { holeCardHidden: false, winner: 'push' } };
