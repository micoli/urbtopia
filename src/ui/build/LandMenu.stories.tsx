import type { Meta, StoryObj } from '@storybook/react-vite';
import { LandMenu } from './LandMenu';

const meta = { title: 'Build/LandMenu', component: LandMenu, parameters: { game: 'evolved' } } satisfies Meta<typeof LandMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
