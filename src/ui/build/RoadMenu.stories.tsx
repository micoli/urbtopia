import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoadMenu } from './RoadMenu';

const meta = { title: 'Build/RoadMenu', component: RoadMenu, parameters: { game: 'evolved' } } satisfies Meta<typeof RoadMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
