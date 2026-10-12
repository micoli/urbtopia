import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadialMenu } from './RadialMenu';

const meta = { title: 'Layout/RadialMenu', component: RadialMenu, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof RadialMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
