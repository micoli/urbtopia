import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardDeck } from './CardDeck';

const meta = { title: 'Casino/CardDeck', component: CardDeck } satisfies Meta<typeof CardDeck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
