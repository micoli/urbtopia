import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarketModal } from './MarketModal';

const meta = { title: 'Market/MarketModal', component: MarketModal, parameters: { layout: 'fullscreen', game: 'evolved' } } satisfies Meta<typeof MarketModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { parameters: { stores: { ui: { marketOpen: true } } } };
