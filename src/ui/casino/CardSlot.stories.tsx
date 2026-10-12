import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardSlot } from './CardSlot';

const meta = { title: 'Casino/CardSlot', component: CardSlot, args: { card: { rank: 'K', suit: 'hearts' } } } satisfies Meta<typeof CardSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FaceUp: Story = {};
export const FaceDown: Story = { args: { faceDown: true } };
export const Empty: Story = { args: { card: null } };
