import type { Meta, StoryObj } from '@storybook/react-vite';
import { CityStats } from './CityStats';

const meta = { title: 'Stats/CityStats', component: CityStats } satisfies Meta<typeof CityStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Evolved: Story = { parameters: { game: 'evolved' } };
