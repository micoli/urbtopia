import type { Meta, StoryObj } from '@storybook/react-vite';
import { FleetPurchase } from './FleetPurchase';

const meta = { title: 'Stats/FleetPurchase', component: FleetPurchase, parameters: { game: 'evolved' } } satisfies Meta<typeof FleetPurchase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Evolved: Story = {};
