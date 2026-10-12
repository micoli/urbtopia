import type { Meta, StoryObj } from '@storybook/react-vite';
import { MinimalStats } from './MinimalStats';

const meta = { title: 'Stats/MinimalStats', component: MinimalStats } satisfies Meta<typeof MinimalStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Evolved: Story = { parameters: { game: 'evolved' } };
