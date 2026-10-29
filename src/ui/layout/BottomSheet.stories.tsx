import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomSheet } from './BottomSheet';

const meta = { title: 'Layout/BottomSheet', component: BottomSheet, parameters: { layout: 'fullscreen', game: 'showcase' } } satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selection: Story = { parameters: { stores: { selectBuilding: 'home' } } };
export const Build: Story = { parameters: { stores: { ui: { flyout: 'build' } } } };
