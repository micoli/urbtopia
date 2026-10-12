import type { Meta, StoryObj } from '@storybook/react-vite';
import { CityManagement } from './CityManagement';

const meta = { title: 'Stats/CityManagement', component: CityManagement } satisfies Meta<typeof CityManagement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { parameters: { stores: { ui: { statsOpen: true } } } };
export const Evolved: Story = { parameters: { game: 'evolved', stores: { ui: { statsOpen: true } } } };
