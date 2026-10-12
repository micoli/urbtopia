import type { Meta, StoryObj } from '@storybook/react-vite';
import { WaterTools } from './WaterTools';

const meta = { title: 'Build/WaterTools', component: WaterTools, parameters: { game: 'evolved' } } satisfies Meta<typeof WaterTools>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
