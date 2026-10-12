import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutBottomMenu } from './LayoutBottomMenu';

const meta = { title: 'Layout/LayoutBottomMenu', component: LayoutBottomMenu, parameters: { layout: 'fullscreen', game: 'evolved' } } satisfies Meta<typeof LayoutBottomMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
