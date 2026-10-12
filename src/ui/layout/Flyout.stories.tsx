import type { Meta, StoryObj } from '@storybook/react-vite';
import { Flyout } from './Flyout';

const meta = { title: 'Layout/Flyout', component: Flyout, parameters: { game: 'evolved' } } satisfies Meta<typeof Flyout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Build: Story = { parameters: { stores: { ui: { flyout: 'build' } } } };
export const Roads: Story = { parameters: { stores: { ui: { flyout: 'roads' } } } };
