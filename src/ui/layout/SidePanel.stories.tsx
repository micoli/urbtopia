import type { Meta, StoryObj } from '@storybook/react-vite';
import { SidePanel } from './SidePanel';

const meta = { title: 'Layout/SidePanel', component: SidePanel, parameters: { game: 'showcase' } } satisfies Meta<typeof SidePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = { parameters: { stores: { selectBuilding: 'home' } } };
export const Workshop: Story = { parameters: { stores: { selectBuilding: 'workshop' } } };
export const Shop: Story = { parameters: { stores: { selectBuilding: 'shop' } } };
export const Farm: Story = { parameters: { stores: { selectBuilding: 'farm' } } };
export const Casino: Story = { parameters: { stores: { selectBuilding: 'casino' } } };
export const Hotel: Story = { parameters: { stores: { selectBuilding: 'hotel' } } };
export const BusStop: Story = { parameters: { game: 'loopLine', stores: { selectBuilding: 'busStop' } } };
