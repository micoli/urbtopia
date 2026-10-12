import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarketContent } from './MarketContent';

const meta = { title: 'Market/MarketContent', component: MarketContent } satisfies Meta<typeof MarketContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Evolved: Story = { parameters: { game: 'evolved' } };
