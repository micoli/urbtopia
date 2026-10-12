import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardHand } from './CardHand';

const meta = {
  title: 'Casino/CardHand',
  component: CardHand,
  args: { label: 'Player', cards: [{ rank: 'K', suit: 'spades' }, { rank: '7', suit: 'hearts' }] },
} satisfies Meta<typeof CardHand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const DealerHidden: Story = { args: { label: 'Dealer', hideSecond: true } };
export const WithBadge: Story = { args: { badge: <strong>Winner</strong> } };
export const ThreeCards: Story = { args: { cards: [{ rank: '5', suit: 'clubs' }, { rank: '6', suit: 'diamonds' }, { rank: '9', suit: 'spades' }] } };
