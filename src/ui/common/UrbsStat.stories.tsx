import type { Meta, StoryObj } from '@storybook/react-vite';
import { UrbsStat } from './UrbsStat';

const meta = { title: 'Common/UrbsStat', component: UrbsStat } satisfies Meta<typeof UrbsStat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Starter: Story = {};
export const Rich: Story = { parameters: { game: 'rich' } };
export const Poor: Story = { parameters: { game: 'poor' } };
