import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutLeftMenu } from './LayoutLeftMenu';

const meta = { title: 'Layout/LayoutLeftMenu', component: LayoutLeftMenu, parameters: { layout: 'fullscreen', game: 'evolved' } } satisfies Meta<typeof LayoutLeftMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
