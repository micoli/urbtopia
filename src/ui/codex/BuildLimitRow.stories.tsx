import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuildLimitRow } from './BuildLimitRow';

const meta = { title: 'Codex/BuildLimitRow', component: BuildLimitRow, args: { type: 'powerPlant' }, parameters: { game: 'evolved' } } satisfies Meta<typeof BuildLimitRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PowerPlant: Story = {};
export const Workshop: Story = { args: { type: 'workshop' } };
