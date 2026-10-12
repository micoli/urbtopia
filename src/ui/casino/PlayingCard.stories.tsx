import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayingCard } from './PlayingCard';

const meta = { title: 'Casino/PlayingCard', component: PlayingCard, args: { card: { rank: 'A', suit: 'spades' } } } satisfies Meta<typeof PlayingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spades: Story = {};
export const Hearts: Story = { args: { card: { rank: 'Q', suit: 'hearts' } } };
export const Diamonds: Story = { args: { card: { rank: '10', suit: 'diamonds' } } };
export const Clubs: Story = { args: { card: { rank: '7', suit: 'clubs' } } };
export const FaceDown: Story = { args: { card: null } };
