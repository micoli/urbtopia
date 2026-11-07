import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutRadial } from './LayoutRadial';

const meta = { title: 'Main/Layout/LayoutRadial', component: LayoutRadial, parameters: { layout: 'fullscreen', game: 'evolved' } } satisfies Meta<typeof LayoutRadial>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
